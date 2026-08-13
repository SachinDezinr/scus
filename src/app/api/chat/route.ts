import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

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

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const query = message.trim().toLowerCase();
    const isAdmin = user.role === 'admin';

    let reply = '';
    const cards: ActionableCard[] = [];

    // ── ADMIN QUERIES ──
    if (
      isAdmin &&
      (query.includes('stat') ||
        query.includes('overview') ||
        query.includes('summary') ||
        query.includes('admin') ||
        query.includes('how many'))
    ) {
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

      reply = `👋 **Hello Admin ${user.name}!** Here is the current system summary:\n\n` +
        `• **Users Registered:** ${userCount.total}\n` +
        `• **Complaints:** ${complaintStats.total} total (${complaintStats.pending} Pending, ${complaintStats.in_progress} In Progress, ${complaintStats.resolved} Resolved)\n` +
        `• **Lost & Found:** ${lostCount.total} Lost items reported, ${foundCount.total} Found items reported\n` +
        `• **Resource Library:** ${resCount.total} study materials available`;

      cards.push(
        { type: 'stat', title: 'Pending Complaints', subtitle: `${complaintStats.pending} requiring review`, badge: 'Pending', badgeColor: '#fbbf24', link: '/dashboard/admin' },
        { type: 'stat', title: 'Total Resources', subtitle: `${resCount.total} PDFs uploaded`, badge: 'Resources', badgeColor: '#00f5d4', link: '/dashboard/resources' },
        { type: 'stat', title: 'Lost & Found Items', subtitle: `${lostCount.total} lost / ${foundCount.total} found`, badge: 'Active', badgeColor: '#ff6b6b', link: '/dashboard/lost-found' }
      );

      return NextResponse.json({ reply, cards });
    }

    // ── RESOURCES INTENT ──
    if (
      query.includes('resource') ||
      query.includes('note') ||
      query.includes('pyq') ||
      query.includes('study') ||
      query.includes('subject') ||
      query.includes('pdf') ||
      query.includes('book') ||
      query.includes('material') ||
      query.includes('paper')
    ) {
      const keywords = query.replace(/(find|search|show|get|resource|notes|pyq|study|materials|pdf|for|the|me|a|in|any)/g, '').trim();
      
      let resourcesList;
      if (keywords.length > 1) {
        resourcesList = await sql`
          SELECT * FROM resources 
          WHERE subject_name ILIKE ${'%' + keywords + '%'} 
             OR course_name ILIKE ${'%' + keywords + '%'}
             OR uploader_name ILIKE ${'%' + keywords + '%'}
          ORDER BY created_at DESC LIMIT 5
        `;
      } else {
        resourcesList = await sql`SELECT * FROM resources ORDER BY created_at DESC LIMIT 5`;
      }

      if (resourcesList.length > 0) {
        reply = `📚 I found **${resourcesList.length} resource(s)** ${keywords ? `matching "${keywords}"` : 'recently uploaded'}:`;
        resourcesList.forEach((r: any) => {
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
        reply = `🔍 I couldn't find any resources matching **"${keywords}"**. You can be the first to upload notes for this subject on the Resource Exchange page!`;
      }

      return NextResponse.json({ reply, cards });
    }

    // ── LOST AND FOUND INTENT ──
    if (
      query.includes('lost') ||
      query.includes('found') ||
      query.includes('item') ||
      query.includes('wallet') ||
      query.includes('phone') ||
      query.includes('bag') ||
      query.includes('key') ||
      query.includes('bottle') ||
      query.includes('laptop') ||
      query.includes('card') ||
      query.includes('umbrella') ||
      query.includes('id')
    ) {
      const isLostSearch = query.includes('lost') || !query.includes('found');
      const cleanKeywords = query.replace(/(find|search|show|get|lost|found|item|items|i|a|the|me|is|there|any|where|my)/g, '').trim();

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
        reply = `✨ Here are the matching Lost & Found entries:`;
        
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
        reply = `🔍 I checked our Lost & Found registry, but couldn't find any item matching **"${cleanKeywords || 'your search'}"**. You can report a lost or found item easily!`;
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
        reply = `ℹ️ You currently have no active complaints filed. If something on campus needs repair (fans, projectors, lights), you can submit a report under Infrastructure Complaints!`;
      }

      return NextResponse.json({ reply, cards });
    }

    // ── GENERAL PLATFORM / HELP INTENT ──
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('help')) {
      reply = `Hello **${user.name}**! 👋 I am your Smart Student Utility Assistant. Here is what I can do for you:\n\n` +
        `1. **Search Notes & PYQs**: Ask *"Find Data Structures notes"* or *"Show B.Tech CSE resources"*\n` +
        `2. **Check Lost & Found**: Ask *"Is there a lost blue wallet?"* or *"Show found phones"*\n` +
        `3. **Track Complaints**: Ask *"What is the status of my complaints?"*\n` +
        (isAdmin ? `4. **Admin Dashboard Stats**: Ask *"Show overview stats"* or *"How many pending complaints?"*` : '');

      return NextResponse.json({ reply, cards: [] });
    }

    // ── GENERAL FALLBACK WITH DB SEARCH ──
    const searchKeyword = query.split(' ').filter(w => w.length > 3)[0] || '';
    if (searchKeyword) {
      const resList = await sql`SELECT * FROM resources WHERE subject_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;
      const lostList = await sql`SELECT * FROM lost_items WHERE item_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;
      const foundList = await sql`SELECT * FROM found_items WHERE item_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;

      if (resList.length > 0 || lostList.length > 0 || foundList.length > 0) {
        reply = `🤖 Here is what I found in the system for **"${searchKeyword}"**:`;

        resList.forEach((r: any) => {
          cards.push({
            type: 'resource',
            id: r.id,
            title: r.subject_name,
            subtitle: `Notes by ${r.uploader_name}`,
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
    }

    reply = `I didn't quite catch that. You can ask me about:\n\n` +
      `• **Resources**: *"Search Operating System PYQs"*\n` +
      `• **Lost & Found**: *"Any found keys in library?"*\n` +
      `• **Complaints**: *"Check status of my repair requests"*\n` +
      (isAdmin ? `• **Admin**: *"System stats summary"*` : '');

    return NextResponse.json({ reply, cards: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}