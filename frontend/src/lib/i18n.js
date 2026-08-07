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
    resolution_hub: 'National Public Grievance & Technical Redressal Portal',
    welcome_back: 'Welcome Citizen',
    track_or_submit: 'Track your filed grievances or register a new inquiry under Citizen Services Charter.',
    need_help_sub: 'File your grievance or technical service request below for official redressal.',
    ticket_subject_req: 'Subject of Grievance / Service Inquiry *',
    subject_placeholder: 'Specify particulars of your grievance or technical difficulty...',
    detailed_desc_req: 'Detailed Particulars of Grievance *',
    desc_placeholder: 'Provide complete description, reference numbers, or step-by-step particulars for official review...',
    file_attachments: 'Supporting Evidentiary Documents / Screenshots',
    drag_drop_text: 'Click to upload supporting documents or drag files here',
    upload_hint: 'PDF, logs, screenshots, or stack trace files (Max 25MB)',
    submit_btn: 'File Grievance with Public Redressal Officer',
    submitting: 'Registering Grievance Docket...',
    submitted_success: 'Grievance Successfully Docketed!',
    analyzed_by_ai: 'Your grievance has been assigned an Official Tracking Number under Citizen Charter Guidelines:',
    track_status_btn: 'Track Grievance Docket Status',
    view_my_queue: 'View My Filed Grievances',
    submit_another: 'Register Another Grievance',
    copy_id: 'Copy Reference ID',
    copied: 'Copied!'
  },
  hi: {
    // Topbar & Nav
    dashboard: 'डैशबोर्ड',
    ticket_queue: 'शिकायत कतार',
    agent_management: 'अधिकारी प्रबंधन',
    analytics: 'विश्लेषण',
    model: 'एआई मॉडल',
    home: 'मुख्य पृष्ठ',
    my_tickets: 'मेरी शिकायतें',
    track_ticket: 'शिकायत ट्रैक करें',
    faq_help: 'सामान्य प्रश्न / सहायता',
    good_morning: 'सुप्रभात',
    good_afternoon: 'नमस्कार',
    good_evening: 'शुभ संध्या',
    total_tickets: 'कुल शिकायतें',
    open_tickets: 'लंबित शिकायतें',
    in_progress: 'प्रगति पर है',
    resolved: 'निस्तारित (Resolved)',
    create_internal_ticket: 'आंतरिक शिकायत दर्ज करें',
    create_ticket: 'नई शिकायत दर्ज करें',
    submit_support_ticket: 'जन शिकायत दर्ज करें',
    registered_agent_roster: 'श्रेणी के अनुसार पंजीकृत अधिकारी सूची',
    priority_level: 'प्राथमिकता स्तर',
    ai_score: 'एआई स्कोर',
    ticket_subject: 'शिकायत का विषय',
    category: 'विभाग / श्रेणी',
    assigned_agent: 'आवंटित अधिकारी',
    status: 'स्थिति',
    created: 'दर्ज दिनांक',
    action: 'कार्रवाई',
    view: 'देखें',
    auto_assign_all: '⚡ स्वचालित अधिकारी आवंटन',
    export_csv: 'शिकायतें निर्यातीत करें (CSV)',
    search_placeholder: 'शिकायत संदर्भ संख्या या सहायता खोजें...',
    notifications: 'सूचनाएं',
    log_out: 'लॉग आउट',
    admin_portal: 'मंत्रालय नियंत्रण केंद्र',
    agent_workspace: 'शिकायत निवारण अधिकारी कार्यक्षेत्र',
    customer_portal: 'नागरिक सेवा पोर्टल',

    // Home Page & Forms
    resolution_hub: 'राष्ट्रीय जन शिकायत एवं तकनीकी निवारण पोर्टल',
    welcome_back: 'आपका स्वागत है, नागरिक',
    track_or_submit: 'अपनी दर्ज शिकायतों की स्थिति जांचें या नागरिक सेवा चार्टर के तहत नई शिकायत दर्ज करें।',
    need_help_sub: 'सरकारी सेवा या तकनीकी सहायता हेतु अपनी शिकायत का विवरण नीचे दर्ज करें।',
    ticket_subject_req: 'शिकायत का विषय *',
    subject_placeholder: 'अपनी शिकायत या तकनीकी कठिनाई का संक्षिप्त विषय लिखें...',
    detailed_desc_req: 'शिकायत का विस्तृत विवरण एवं आवश्यक तथ्य *',
    desc_placeholder: 'अपनी शिकायत का पूरा विवरण, घटना का समय एवं आवश्यक तथ्य दर्ज करें...',
    file_attachments: 'सहायक दस्तावेज / साक्ष्य (Attachments)',
    drag_drop_text: 'सहायक दस्तावेज अपलोड करने के लिए क्लिक करें या फ़ाइलें खींचें',
    upload_hint: 'पीडीएफ, स्क्रीनशॉट या दस्तावेज फ़ाइलें (अधिकतम 25MB)',
    submit_btn: 'शिकायत निवारण अधिकारी को भेजें',
    submitting: 'शिकायत दर्ज हो रही है...',
    submitted_success: 'शिकायत सफलतापूर्वक दर्ज की गई!',
    analyzed_by_ai: 'आपके टिकट का विश्लेषण हमारे एआई इंजन द्वारा किया गया है। आपका यूनिक टिकट आईडी:',
    track_status_btn: 'टिकट स्थिति ट्रैक करें',
    view_my_queue: 'मेरे टिकट देखें',
    submit_another: 'एक और टिकट सबमिट करें',
    copy_id: 'आईडी कॉपी करें',
    copied: 'कॉपी हो गया!'
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
