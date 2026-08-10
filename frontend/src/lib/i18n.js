import { useState, useEffect } from 'react'

export const TRANSLATIONS = {
  en: {
    // Topbar & Nav
    dashboard: 'Dashboard',
    ticket_queue: 'Ticket Queue',
    agent_management: 'Agent Management',
    analytics: 'Analytics',
    model: 'Model',
    home: 'Home',
    my_tickets: 'My Tickets',
    track_ticket: 'Track Ticket',
    faq_help: 'FAQ / Help',
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    total_tickets: 'Total Tickets',
    open_tickets: 'Open Tickets',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    create_internal_ticket: 'Create Internal Ticket',
    create_ticket: 'Submit a New Ticket',
    submit_support_ticket: 'Submit a Support Ticket',
    registered_agent_roster: 'Registered Agent Roster by Category',
    priority_level: 'Priority Level',
    ai_score: 'AI Score',
    ticket_subject: 'Ticket Subject',
    category: 'Category',
    assigned_agent: 'Assigned Agent',
    status: 'Status',
    created: 'Created',
    action: 'Action',
    view: 'View',
    auto_assign_all: '⚡ Auto-Assign All',
    export_csv: 'Export Tickets (CSV)',
    search_placeholder: 'Search tickets, agents, or help...',
    notifications: 'Notifications',
    log_out: 'Log Out',
    admin_portal: 'Admin Portal',
    agent_workspace: 'Agent Workspace',
    customer_portal: 'Customer Portal',

    // Home Page & Forms
    resolution_hub: 'TicketFlow AI Resolution Hub',
    welcome_back: 'Welcome back',
    track_or_submit: 'Track your existing tickets or submit a new inquiry below.',
    need_help_sub: 'Need help or encountering a system issue? Fill in your query details below.',
    ticket_subject_req: 'Ticket Subject *',
    subject_placeholder: 'Brief summary of your technical issue or question...',
    detailed_desc_req: 'Detailed Description *',
    desc_placeholder: 'Describe your issue, error codes, steps to reproduce, or requirements in detail...',
    file_attachments: 'File Attachments',
    drag_drop_text: 'Click to upload or drag and drop',
    upload_hint: 'Logs, screenshots, or stack trace files (Max 25MB)',
    submit_btn: 'Submit Ticket to AI Triage Engine',
    submitting: 'Submitting Ticket...',
    submitted_success: 'Thank you! Your ticket has been submitted.',
    analyzed_by_ai: 'Your ticket has been analyzed by our AI Prioritization Engine. Here is your unique Ticket ID:',
    track_status_btn: 'Track Ticket Status',
    view_my_queue: 'View My Tickets Queue',
    submit_another: 'Submit Another Query',
    copy_id: 'Copy ID',
    copied: 'Copied!',

    // FAQ & Help
    faq_title: 'Knowledge Base & FAQ',
    faq_subtitle: 'Find answers to common questions or submit a ticket if you need further help.',
    faq_search_placeholder: "Ask AI or search knowledge base (e.g. 'How to track ticket', '504 error')...",
    all_categories: 'All',
    category_general: 'General',
    category_tech: 'Technical Support',
    category_billing: 'Billing & Subscriptions',
    category_account: 'Account & Access',
    no_faqs_found: 'No matching questions found',
    no_faqs_sub: 'Try searching with different keywords or submit a ticket to our support team.',
    still_need_help: 'Still need assistance?',
    contact_support_text: 'Our AI engine and specialist engineering team are ready to resolve your issue.',
    create_ticket_now: 'Create a Support Ticket',

    // Track Ticket Page
    track_title: 'Track Support Ticket',
    track_subtitle: 'Enter your Ticket ID below to check live status, assigned specialist, and SLA countdown.',
    enter_ticket_id: 'Enter Ticket ID *',
    ticket_id_placeholder: 'e.g. TK-8842 or 550e8400-e29b-41d4-a716-446655440000',
    track_now_btn: 'Track Ticket Status',
    searching_ticket: 'Searching Ticket...',
    ticket_not_found: 'Ticket Not Found',
    ticket_not_found_sub: 'No ticket found with ID',
    check_id_hint: 'Please check your Ticket ID and try again.',

    // Ticket History & Queue
    ticket_history_title: 'My Tickets & Support History',
    ticket_history_sub: 'Track status, assigned agents, and updates on all your submitted support queries.',
    filter_status: 'Filter by Status',
    filter_priority: 'Filter by Priority',
    no_tickets_found: 'No tickets found',
    no_tickets_sub: 'You have not submitted any tickets yet.',
  },
  hi: {
    // Topbar & Nav
    dashboard: 'डैशबोर्ड',
    ticket_queue: 'टिकट कतार',
    agent_management: 'एजेंट प्रबंधन',
    analytics: 'विश्लेषण',
    model: 'एआई मॉडल',
    home: 'होम',
    my_tickets: 'मेरे टिकट',
    track_ticket: 'टिकट ट्रैक करें',
    faq_help: 'सामान्य प्रश्न / सहायता',
    good_morning: 'सुप्रभात',
    good_afternoon: 'नमस्कार',
    good_evening: 'शुभ संध्या',
    total_tickets: 'कुल टिकट',
    open_tickets: 'खुले टिकट',
    in_progress: 'प्रगति पर है',
    resolved: 'हल किया गया',
    create_internal_ticket: 'आंतरिक टिकट बनाएं',
    create_ticket: 'नया टिकट जमा करें',
    submit_support_ticket: 'सहायता टिकट जमा करें',
    registered_agent_roster: 'श्रेणी के अनुसार पंजीकृत एजेंट सूची',
    priority_level: 'प्राथमिकता स्तर',
    ai_score: 'एआई स्कोर',
    ticket_subject: 'टिकट का विषय',
    category: 'श्रेणी',
    assigned_agent: 'आवंटित एजेंट',
    status: 'स्थिति',
    created: 'बनाया गया',
    action: 'कार्रवाई',
    view: 'देखें',
    auto_assign_all: '⚡ सभी स्वचालित रूप से असाइन करें',
    export_csv: 'टिकट निर्यातीत करें (CSV)',
    search_placeholder: 'टिकट, एजेंट या सहायता खोजें...',
    notifications: 'सूचनाएं',
    log_out: 'लॉग आउट',
    admin_portal: 'एडमिन पोर्टल',
    agent_workspace: 'एजेंट कार्यक्षेत्र',
    customer_portal: 'ग्राहक पोर्टल',

    // Home Page & Forms
    resolution_hub: 'टिकटफ़्लो एआई समाधान हब',
    welcome_back: 'आपका पुनः स्वागत है',
    track_or_submit: 'अपने मौजूदा टिकटों को ट्रैक करें या नीचे नया प्रश्न दर्ज करें।',
    need_help_sub: 'क्या आपको सहायता चाहिए या कोई समस्या आ रही है? नीचे अपना विवरण भरें।',
    ticket_subject_req: 'टिकट का विषय *',
    subject_placeholder: 'अपनी तकनीकी समस्या या प्रश्न का संक्षिप्त विवरण दें...',
    detailed_desc_req: 'विस्तृत विवरण *',
    desc_placeholder: 'अपनी समस्या, एरर कोड, और पुनरुत्पादन के चरणों का विस्तार से वर्णन करें...',
    file_attachments: 'फ़ाइल संलग्नक (Attachments)',
    drag_drop_text: 'अपलोड करने के लिए क्लिक करें या फ़ाइलें यहाँ खींचें',
    upload_hint: 'लॉग्स, स्क्रीनशॉट या त्रुटि फ़ाइलें (अधिकतम 25MB)',
    submit_btn: 'एआई ट्राइएज इंजन को टिकट जमा करें',
    submitting: 'टिकट सबमिट हो रहा है...',
    submitted_success: 'धन्यवाद! आपका टिकट सफलतापूर्वक सबमिट हो गया है।',
    analyzed_by_ai: 'आपके टिकट का विश्लेषण हमारे एआई इंजन द्वारा किया गया है। आपका यूनिक टिकट आईडी:',
    track_status_btn: 'टिकट स्थिति ट्रैक करें',
    view_my_queue: 'मेरे टिकट देखें',
    submit_another: 'एक और टिकट सबमिट करें',
    copy_id: 'आईडी कॉपी करें',
    copied: 'कॉपी हो गया!',

    // FAQ & Help (Hindi)
    faq_title: 'ज्ञान केंद्र और सामान्य प्रश्न (FAQ)',
    faq_subtitle: 'सामान्य प्रश्नों के उत्तर खोजें या सहायता के लिए नया टिकट जमा करें।',
    faq_search_placeholder: "एआई से पूछें या ज्ञान केंद्र में खोजें (जैसे 'टिकट ट्रैक कैसे करें', '504 एरर')...",
    all_categories: 'सभी',
    category_general: 'सामान्य (General)',
    category_tech: 'तकनीकी सहायता (Technical Support)',
    category_billing: 'बिलिंग और सदस्यता (Billing)',
    category_account: 'खाता और पहुंच (Account)',
    no_faqs_found: 'कोई मेल खाते प्रश्न नहीं मिले',
    no_faqs_sub: 'अन्य खोज शब्दों का प्रयास करें या सहायता टीम को टिकट सबमिट करें।',
    still_need_help: 'क्या आपको अभी भी सहायता की आवश्यकता है?',
    contact_support_text: 'हमारा एआई इंजन और विशेषज्ञ इंजीनियर्स आपकी समस्या को तुरंत हल करने के लिए तैयार हैं।',
    create_ticket_now: 'सहायता टिकट बनाएं',

    // Track Ticket Page (Hindi)
    track_title: 'सहायता टिकट ट्रैक करें',
    track_subtitle: 'लाइव स्थिति, आवंटित विशेषज्ञ और एसएलए समय देखने के लिए नीचे अपनी टिकट आईडी दर्ज करें।',
    enter_ticket_id: 'टिकट आईडी दर्ज करें *',
    ticket_id_placeholder: 'जैसे TK-8842 या 550e8400-e29b-41d4-a716-446655440000',
    track_now_btn: 'टिकट स्थिति जांचें',
    searching_ticket: 'टिकट खोजा जा रहा है...',
    ticket_not_found: 'टिकट नहीं मिला',
    ticket_not_found_sub: 'इस आईडी के साथ कोई टिकट नहीं मिला',
    check_id_hint: 'कृपया अपनी टिकट आईडी की जांच करें और पुनः प्रयास करें।',

    // Ticket History & Queue (Hindi)
    ticket_history_title: 'मेरे टिकट और सहायता इतिहास',
    ticket_history_sub: 'अपने सभी सबमिट किए गए प्रश्नों की लाइव स्थिति और अपडेट ट्रैक करें।',
    filter_status: 'स्थिति के अनुसार फ़िल्टर करें',
    filter_priority: 'प्राथमिकता के अनुसार फ़िल्टर करें',
    no_tickets_found: 'कोई टिकट नहीं मिला',
    no_tickets_sub: 'आपने अभी तक कोई टिकट सबमिट नहीं किया है।',
  }
}

export function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem('tf_lang') || 'en')

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('tf_lang') || 'en')
    }
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key
  }

  return { t, lang }
}
