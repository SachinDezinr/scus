import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, sanitizeText } from '@/lib/security';

interface ActionableCard {
  type: 'resource' | 'lost' | 'found' | 'complaint' | 'stat';
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  link?: string;
  badge?: string;
  badgeColor?: string;
}

// Acronym and synonym map for common academic subjects
const SUBJECT_ACRONYMS: Record<string, string[]> = {
  dsa: ['dsa', 'data structure', 'data structures', 'algorithm', 'algorithms', 'ds'],
  ds: ['ds', 'dsa', 'data structure', 'data structures'],
  os: ['os', 'operating system', 'operating systems'],
  dbms: ['dbms', 'database', 'sql', 'rdbms', 'database management'],
  cn: ['cn', 'computer network', 'computer networks', 'networking'],
  oops: ['oops', 'oop', 'object oriented', 'cpp', 'c++', 'java'],
  oop: ['oops', 'oop', 'object oriented', 'cpp', 'c++', 'java'],
  toc: ['toc', 'theory of computation', 'automata', 'flat'],
  se: ['se', 'software engineering', 'software design'],
  cpp: ['cpp', 'c++', 'c language'],
  'c++': ['cpp', 'c++', 'c language'],
  python: ['python', 'py'],
  py: ['python', 'py'],
  ai: ['ai', 'artificial intelligence', 'machine learning', 'ml'],
  ml: ['ml', 'machine learning', 'artificial intelligence', 'ai'],
  web: ['web', 'web development', 'html', 'css', 'javascript', 'react', 'frontend', 'backend'],
  math: ['math', 'maths', 'mathematics', 'calculus', 'discrete'],
  maths: ['math', 'maths', 'mathematics', 'calculus', 'discrete'],
};

export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req);
    // Rate limit: Max 20 chat messages per minute
    const rateCheck = checkRateLimit(`chat:${user.userId}:${ip}`, 20, 60 * 1000);
    if (!rateCheck.success && rateCheck.response) return rateCheck.response;

    await ensureTablesExist();

    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const rawMessage = sanitizeText(message.trim());
    const query = rawMessage.toLowerCase();
    const isAdmin = user.role === 'admin';

    let reply = '';
    const cards: ActionableCard[] = [];

    // ── ADMIN / SYSTEM OVERVIEW INTENT ──
    const isAdminIntent = 
      query.includes('stat') ||
      query.includes('overview') ||
      query.includes('summary') ||
      query.includes('admin') ||
      query.includes('analytics') ||
      query.includes('total users') ||
      query.includes('how many users') ||
      query.includes('how many complaints');

    if (isAdminIntent && (query.includes('admin') || query.includes('stat') || query.includes('users') || query.includes('overview'))) {
      if (isAdmin) {
        const [complaintStats] = await sql`
          SELECT 
            COUNT(*)::int as total,
            COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
            COUNT(CASE WHEN status = 'in progress' THEN 1 END)::int as in_progress,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int as resolved
          FROM complaints
        `;

        const [lostCount] = await sql`SELECT COUNT(*)::int as total FROM lost_items`;
        const [foundCount] = await sql`SELECT COUNT(*)::int as total FROM found_items`;
        const [resCount] = await sql`SELECT COUNT(*)::int as total FROM resources`;
        const [userCount] = await sql`SELECT COUNT(*)::int as total FROM users`;

        reply = `👋 Hello Admin **${user.name}**! Here is the current system overview:\n\n` +
          `• Registered Users: **${userCount.total}**\n` +
          `• Complaints: **${complaintStats.total}** total (${complaintStats.pending} Pending, ${complaintStats.in_progress} In Progress, ${complaintStats.resolved} Resolved)\n` +
          `• Lost & Found: **${lostCount.total}** Lost items, **${foundCount.total}** Found items\n` +
          `• Resource Library: **${resCount.total}** study materials uploaded`;

        cards.push(
          { type: 'stat', title: 'Pending Complaints', subtitle: `${complaintStats.pending} pending review`, badge: 'Pending', badgeColor: '#fbbf24', link: '/dashboard/admin' },
          { type: 'stat', title: 'Total Resources', subtitle: `${resCount.total} PDFs uploaded`, badge: 'Resources', badgeColor: '#00f5d4', link: '/dashboard/resources' },
          { type: 'stat', title: 'Lost & Found Items', subtitle: `${lostCount.total} lost / ${foundCount.total} found`, badge: 'Active', badgeColor: '#ff6b6b', link: '/dashboard/lost-found' }
        );

        return NextResponse.json({ reply, cards });
      } else {
        reply = `🔒 Access Restricted: System-wide overview metrics and administrative control panels are reserved exclusively for Administrator accounts.\n\nAs a student, you can ask me to:\n` +
          `• Search study notes & PYQs\n` +
          `• Look up lost & found items\n` +
          `• Check the status of your own infrastructure complaints\n` +
          `• Report new issues or share study materials!`;

        return NextResponse.json({ reply, cards: [] });
      }
    }

    // ── SMART RESOURCE SEARCH INTENT ──
    const stopWords = new Set([
      'find', 'search', 'show', 'get', 'resource', 'resources', 'note', 'notes',
      'pyq', 'pyqs', 'study', 'materials', 'material', 'pdf', 'pdfs', 'for', 'the',
      'me', 'a', 'in', 'any', 'is', 'there', 'have', 'you', 'give', 'can', 'i',
      'want', 'need', 'please', 'paper', 'papers', 'book', 'books', 'subject', 'all'
    ]);

    const cleanTokens = query
      .replace(/[^\w\s\+]/g, ' ')
      .split(/\s+/)
      .filter(w => !stopWords.has(w) && w.length > 0);

    const isExplicitResourceQuery = 
      query.includes('resource') ||
      query.includes('note') ||
      query.includes('pyq') ||
      query.includes('study') ||
      query.includes('pdf') ||
      query.includes('material') ||
      query.includes('paper') ||
      cleanTokens.some(token => SUBJECT_ACRONYMS[token] !== undefined);

    if (isExplicitResourceQuery) {
      let searchTerms: string[] = [];
      cleanTokens.forEach(token => {
        searchTerms.push(token);
        if (SUBJECT_ACRONYMS[token]) {
          searchTerms.push(...SUBJECT_ACRONYMS[token]);
        }
      });
      searchTerms = Array.from(new Set(searchTerms)).filter(t => t.length > 0);

      const allResources = await sql`SELECT * FROM resources ORDER BY created_at DESC LIMIT 100`;

      let matchedResources = allResources;
      if (searchTerms.length > 0) {
        matchedResources = allResources.filter(r => {
          const haystack = `${r.subject_name} ${r.course_name} ${r.uploader_name} ${r.file_name} ${r.tips || ''}`.toLowerCase();
          return searchTerms.some(term => haystack.includes(term.toLowerCase()));
        });
      }

      const topMatches = matchedResources.slice(0, 8);

      if (topMatches.length > 0) {
        const queryTermDisplay = searchTerms.length > 0 ? cleanTokens.join(' ').toUpperCase() : 'All Available Resources';
        reply = `📚 I found **${topMatches.length} study material(s)** for "${queryTermDisplay}":`;
        topMatches.forEach((r: any) => {
          cards.push({
            type: 'resource',
            id: r.id,
            title: r.subject_name,
            subtitle: `Course: ${r.course_name} • By ${r.uploader_name}`,
            meta: r.tips ? `Tip: ${r.tips}` : undefined,
            link: r.file_url,
            badge: 'PDF Material',
            badgeColor: '#fbbf24',
          });
        });
      } else {
        const queryDisplay = cleanTokens.join(' ') || query;
        reply = `🔍 I couldn't find any uploaded study materials for "${queryDisplay}" yet.\n\nYou can be the first to upload notes or PYQs for this subject on the Resource Exchange page!`;
      }

      return NextResponse.json({ reply, cards });
    }

    // ── LOST AND FOUND INTENT ──
    const isLostFoundQuery = 
      query.includes('lost') ||
      query.includes('found') ||
      query.includes('registry') ||
      query.includes('wallet') ||
      query.includes('phone') ||
      query.includes('bag') ||
      query.includes('key') ||
      query.includes('bottle') ||
      query.includes('laptop') ||
      query.includes('card') ||
      query.includes('umbrella') ||
      query.includes('id');

    if (isLostFoundQuery) {
      const isRegistryRequest = query.includes('registry') || query.includes('all') || query.includes('summary') || query.includes('how many');

      if (isRegistryRequest || (!query.includes('wallet') && !query.includes('phone') && !query.includes('bag') && !query.includes('key') && !query.includes('bottle') && !query.includes('laptop') && !query.includes('card') && !query.includes('umbrella') && !query.includes('id'))) {
        const [lostCount] = await sql`SELECT COUNT(*)::int as total FROM lost_items`;
        const [foundCount] = await sql`SELECT COUNT(*)::int as total FROM found_items`;

        const recentLost = await sql`SELECT * FROM lost_items ORDER BY created_at DESC LIMIT 3`;
        const recentFound = await sql`SELECT * FROM found_items ORDER BY created_at DESC LIMIT 3`;

        reply = `📋 Lost & Found Registry Overview:\n\n` +
          `• Lost Items Reported: **${lostCount.total}**\n` +
          `• Found Items Reported: **${foundCount.total}**\n\n` +
          `Here are the latest entries in the campus registry:`;

        recentLost.forEach((item: any) => {
          cards.push({
            type: 'lost',
            id: item.id,
            title: `Lost: ${item.item_name} (${item.color})`,
            subtitle: `Location: ${item.location || 'N/A'} • Owner: ${item.owner_name}`,
            meta: `Contact: ${item.phone}`,
            link: '/dashboard/lost-found',
            badge: 'LOST',
            badgeColor: '#ff6b6b',
          });
        });

        recentFound.forEach((item: any) => {
          cards.push({
            type: 'found',
            id: item.id,
            title: `Found: ${item.item_name} (${item.color})`,
            subtitle: `Location: ${item.location || 'N/A'} • Finder: ${item.finder_name}`,
            meta: `Contact: ${item.phone}`,
            link: '/dashboard/lost-found',
            badge: 'FOUND',
            badgeColor: '#00f5d4',
          });
        });

        return NextResponse.json({ reply, cards });
      }

      const cleanKeywords = query.replace(/(find|search|show|get|lost|found|item|items|i|a|the|me|is|there|any|where|my|registry)/g, '').trim();
      const searchPattern = '%' + (cleanKeywords || '') + '%';

      const matchedLost = await sql`
        SELECT * FROM lost_items 
        WHERE (${cleanKeywords.length > 0 ? true : false} = false OR item_name ILIKE ${searchPattern} OR color ILIKE ${searchPattern} OR location ILIKE ${searchPattern})
        ORDER BY created_at DESC LIMIT 4
      `;

      const matchedFound = await sql`
        SELECT * FROM found_items 
        WHERE (${cleanKeywords.length > 0 ? true : false} = false OR item_name ILIKE ${searchPattern} OR color ILIKE ${searchPattern} OR location ILIKE ${searchPattern})
        ORDER BY created_at DESC LIMIT 4
      `;

      if (matchedLost.length > 0 || matchedFound.length > 0) {
        reply = `✨ Here are the matching Lost & Found entries for "${cleanKeywords}":`;
        
        matchedLost.forEach((item: any) => {
          cards.push({
            type: 'lost',
            id: item.id,
            title: `Lost: ${item.item_name} (${item.color})`,
            subtitle: `Location: ${item.location || 'N/A'} • Owner: ${item.owner_name}`,
            meta: `Contact: ${item.phone}`,
            link: '/dashboard/lost-found',
            badge: 'LOST',
            badgeColor: '#ff6b6b',
          });
        });

        matchedFound.forEach((item: any) => {
          cards.push({
            type: 'found',
            id: item.id,
            title: `Found: ${item.item_name} (${item.color})`,
            subtitle: `Location: ${item.location || 'N/A'} • Finder: ${item.finder_name}`,
            meta: `Contact: ${item.phone}`,
            link: '/dashboard/lost-found',
            badge: 'FOUND',
            badgeColor: '#00f5d4',
          });
        });
      } else {
        reply = `🔍 I checked our Lost & Found registry, but couldn't find any item matching "${cleanKeywords || 'your search'}". You can report a lost or found item easily!`;
      }

      return NextResponse.json({ reply, cards });
    }

    // ── COMPLAINTS INTENT ──
    if (
      query.includes('complaint') ||
      query.includes('broken') ||
      query.includes('repair') ||
      query.includes('issue') ||
      query.includes('fan') ||
      query.includes('light') ||
      query.includes('projector') ||
      query.includes('ac') ||
      query.includes('chair') ||
      query.includes('bench') ||
      query.includes('status')
    ) {
      if (isAdmin) {
        const allComplaints = await sql`SELECT * FROM complaints ORDER BY created_at DESC LIMIT 5`;
        reply = `🛠️ Admin Complaint Overview: Showing recent complaints system-wide:`;
        allComplaints.forEach((c: any) => {
          cards.push({
            type: 'complaint',
            id: c.id,
            title: c.item_name,
            subtitle: `${c.class_name} • ${c.department}`,
            meta: `Status: ${c.status.toUpperCase()} • Priority: ${c.priority?.toUpperCase() || 'MEDIUM'}`,
            link: '/dashboard/admin',
            badge: c.status.toUpperCase(),
            badgeColor: c.status === 'resolved' ? '#00f5d4' : c.status === 'in progress' ? '#3b82f6' : '#fbbf24',
          });
        });
      } else {
        const userComplaints = await sql`
          SELECT * FROM complaints 
          WHERE user_id = ${user.userId} 
          ORDER BY created_at DESC LIMIT 5
        `;

        if (userComplaints.length > 0) {
          reply = `🛠️ You have **${userComplaints.length} complaint(s)** registered under your account:`;
          userComplaints.forEach((c: any) => {
            cards.push({
              type: 'complaint',
              id: c.id,
              title: c.item_name,
              subtitle: `${c.class_name} • ${c.department}`,
              meta: `Priority: ${c.priority?.toUpperCase() || 'MEDIUM'}`,
              link: '/dashboard/complaints',
              badge: c.status.toUpperCase(),
              badgeColor: c.status === 'resolved' ? '#00f5d4' : c.status === 'in progress' ? '#3b82f6' : '#fbbf24',
            });
          });
        } else {
          reply = `ℹ️ You currently have no active complaints filed. If something on campus needs repair, you can submit a report under Infrastructure Complaints!`;
        }
      }

      return NextResponse.json({ reply, cards });
    }

    // ── GREETING / HELP ──
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('help')) {
      reply = `Hello **${user.name}**! 👋 I am your Smart Campus AI Assistant.\n\n` +
        `Here is what you can ask me:\n` +
        `1. Search Notes & PYQs: "Find study notes", "DSA materials", or "C++"\n` +
        `2. Lost & Found Registry: "Lost & Found Registry" or "Find lost wallet"\n` +
        `3. Complaints: "What is the status of my complaints?"\n` +
        (isAdmin 
          ? `4. Admin Dashboard Stats: "Show system overview stats"` 
          : `4. Note: Administrative stats are restricted to Admin accounts.`);

      return NextResponse.json({ reply, cards: [] });
    }

    // ── FALLBACK SEARCH WITH ACRONYM SUPPORT ──
    const searchToken = cleanTokens[0] || query;
    let fallbackTerms = [searchToken];
    if (SUBJECT_ACRONYMS[searchToken]) {
      fallbackTerms.push(...SUBJECT_ACRONYMS[searchToken]);
    }

    const allRes = await sql`SELECT * FROM resources ORDER BY created_at DESC LIMIT 50`;
    const resList = allRes.filter(r => {
      const haystack = `${r.subject_name} ${r.course_name} ${r.uploader_name} ${r.file_name}`.toLowerCase();
      return fallbackTerms.some(term => haystack.includes(term.toLowerCase()));
    }).slice(0, 5);

    const lostList = await sql`SELECT * FROM lost_items WHERE item_name ILIKE ${'%' + searchToken + '%'} LIMIT 3`;
    const foundList = await sql`SELECT * FROM found_items WHERE item_name ILIKE ${'%' + searchToken + '%'} LIMIT 3`;

    if (resList.length > 0 || lostList.length > 0 || foundList.length > 0) {
      reply = `🤖 Here is what I found for "${searchToken.toUpperCase()}":`;

      resList.forEach((r: any) => {
        cards.push({
          type: 'resource',
          id: r.id,
          title: r.subject_name,
          subtitle: `Course: ${r.course_name} • By ${r.uploader_name}`,
          link: r.file_url,
          badge: 'Resource',
          badgeColor: '#fbbf24',
        });
      });

      lostList.forEach((item: any) => {
        cards.push({
          type: 'lost',
          id: item.id,
          title: `Lost: ${item.item_name}`,
          subtitle: `Contact: ${item.phone}`,
          link: '/dashboard/lost-found',
          badge: 'Lost Item',
          badgeColor: '#ff6b6b',
        });
      });

      foundList.forEach((item: any) => {
        cards.push({
          type: 'found',
          id: item.id,
          title: `Found: ${item.item_name}`,
          subtitle: `Finder: ${item.finder_name}`,
          link: '/dashboard/lost-found',
          badge: 'Found Item',
          badgeColor: '#00f5d4',
        });
      });

      return NextResponse.json({ reply, cards });
    }

    reply = `I couldn't find exact matches for "${rawMessage}". Try asking:\n\n` +
      `• Resources: "Find study notes", "DSA", or "DBMS"\n` +
      `• Lost & Found: "Lost & Found Registry"\n` +
      `• Complaints: "Check status of my repair requests"\n` +
      (isAdmin ? `• Admin: "System stats overview"` : '');

    return NextResponse.json({ reply, cards: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}