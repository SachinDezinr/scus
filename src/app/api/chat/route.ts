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

    if (isAdminIntent) {
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

        reply = `👋 **Hello Admin ${user.name}!** Here is the current system overview:\n\n` +
          `• **Registered Users:** ${userCount.total}\n` +
          `• **Complaints:** ${complaintStats.total} total (${complaintStats.pending} Pending, ${complaintStats.in_progress} In Progress, ${complaintStats.resolved} Resolved)\n` +
          `• **Lost & Found:** ${lostCount.total} Lost items reported, ${foundCount.total} Found items reported\n` +
          `• **Resource Library:** ${resCount.total} study materials uploaded`;

        cards.push(
          { type: 'stat', title: 'Pending Complaints', subtitle: `${complaintStats.pending} pending review`, badge: 'Pending', badgeColor: '#fbbf24', link: '/dashboard/admin' },
          { type: 'stat', title: 'Total Resources', subtitle: `${resCount.total} PDFs uploaded`, badge: 'Resources', badgeColor: '#00f5d4', link: '/dashboard/resources' },
          { type: 'stat', title: 'Lost & Found Items', subtitle: `${lostCount.total} lost / ${foundCount.total} found`, badge: 'Active', badgeColor: '#ff6b6b', link: '/dashboard/lost-found' }
        );

        return NextResponse.json({ reply, cards });
      } else {
        reply = `🔒 **Access Restricted:** System-wide overview metrics and administrative control panels are reserved exclusively for **Administrator** accounts.\n\nAs a student, you can ask me to:\n` +
          `• Search study notes & PYQs (e.g. *"Find Data Structures notes"*)\n` +
          `• Look up lost & found items (e.g. *"Is there any lost blue wallet?"*)\n` +
          `• Check the status of your own infrastructure complaints (e.g. *"Show my complaints"*)\n` +
          `• Report new issues or share study materials!`;

        return NextResponse.json({ reply, cards: [] });
      }
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
      if (isAdmin) {
        const allComplaints = await sql`SELECT * FROM complaints ORDER BY created_at DESC LIMIT 5`;
        reply = `🛠️ **Admin Complaint Overview:** Showing recent complaints system-wide:`;
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
          reply = `ℹ️ You currently have no active complaints filed. If something on campus needs repair (fans, projectors, lights), you can submit a report under Infrastructure Complaints!`;
        }
      }

      return NextResponse.json({ reply, cards });
    }

    // ── GREETING / HELP ──
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('help')) {
      reply = `Hello **${user.name}**! 👋 I am your Smart Campus AI Assistant.\n\n` +
        `Here is what you can ask me:\n` +
        `1. **Search Notes & PYQs**: *"Find Data Structures notes"*\n` +
        `2. **Lost & Found**: *"Is there a lost blue wallet?"*\n` +
        `3. **Complaints**: *"What is the status of my complaints?"*\n` +
        (isAdmin 
          ? `4. **Admin Dashboard Stats**: *"Show system overview stats"*` 
          : `4. **Role note**: Administrative stats are restricted to Admin accounts.`);

      return NextResponse.json({ reply, cards: [] });
    }

    // ── FALLBACK SEARCH ──
    const searchKeyword = query.split(' ').filter(w => w.length > 3)[0] || '';
    if (searchKeyword) {
      const resList = await sql`SELECT * FROM resources WHERE subject_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;
      const lostList = await sql`SELECT * FROM lost_items WHERE item_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;
      const foundList = await sql`SELECT * FROM found_items WHERE item_name ILIKE ${'%' + searchKeyword + '%'} LIMIT 3`;

      if (resList.length > 0 || lostList.length > 0 || foundList.length > 0) {
        reply = `🤖 Here is what I found in the public system for **"${searchKeyword}"**:`;

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

    reply = `I didn't quite catch that. Try asking:\n\n` +
      `• **Resources**: *"Search Operating System notes"*\n` +
      `• **Lost & Found**: *"Any found keys in library?"*\n` +
      `• **Complaints**: *"Check status of my repair requests"*\n` +
      (isAdmin ? `• **Admin**: *"System stats overview"*` : '');

    return NextResponse.json({ reply, cards: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}