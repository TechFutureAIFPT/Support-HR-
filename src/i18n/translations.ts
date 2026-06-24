export type Locale = 'vi-VN' | 'en-US';

const vi = {
  // Sidebar navigation
  nav_overview:        'Tổng quan tuyển dụng',
  nav_upload:          'Nạp hồ sơ ứng viên',
  nav_results:         'Kết quả phân tích',
  nav_analytics:       'Phân tích chi tiết',
  nav_chatbot:         'Trợ lý tuyển dụng AI',
  nav_feedback:        'Phản hồi kết quả AI',
  nav_jd_standardizer: 'Chuẩn hóa JD',
  nav_history:         'Lịch sử lọc CV',
  nav_salary:          'Phân tích lương',
  nav_library:         'Thư viện CV',
  nav_selected:        'Ứng viên chọn',
  nav_settings:        'Cài đặt',
  nav_help:            'Trợ giúp',
  nav_logout:          'Đăng xuất',
  nav_new_session:     'Phiên mới',

  // User menu
  user_docs:        'Tài liệu & hướng dẫn',
  user_faq:         'Câu hỏi thường gặp',
  user_security:    'Bảo mật & tuân thủ',
  user_privacy:     'Chính sách bảo mật',
  user_terms:       'Điều khoản sử dụng',

  // Settings modal — tabs
  settings_title:        'Cài đặt',
  settings_tab_general:  'Chung',
  settings_tab_profile:  'Hồ sơ',
  settings_tab_workflow: 'Quy trình',
  settings_tab_notif:    'Thông báo',
  settings_tab_data:     'Dữ liệu',
  settings_tab_team:     'Set Up Team',
  settings_tab_library:  'Thư viện CV',

  // Settings modal — General tab
  settings_section_ui:           'GIAO DIỆN',
  settings_theme_label:          'Chủ đề màu sắc',
  settings_theme_light:          'Sáng',
  settings_theme_dark:           'Tối',
  settings_theme_system:         'Hệ thống',
  settings_section_language:     'NGÔN NGỮ',
  settings_language_desc:        'Ngôn ngữ hiển thị của giao diện. Áp dụng sau khi tải lại trang.',
  settings_language_vi:          'Tiếng Việt',
  settings_language_en:          'English',
  settings_section_accessibility:'TRỢ NĂNG',
  settings_reduced_motion:       'Giảm chuyển động',
  settings_reduced_motion_desc:  'Tắt animation và hiệu ứng chuyển tiếp.',

  // Settings — sync badge
  settings_saving:    'Đang lưu',
  settings_synced:    'Đã đồng bộ',
  settings_sync_error:'Lỗi đồng bộ',
  settings_not_authed:'Chưa đăng nhập',
  settings_autosave_hint: 'Thay đổi được lưu tự động vào cơ sở dữ liệu.',
  settings_close:     'Đóng',

  // Common
  btn_close:  'Đóng',
  btn_save:   'Lưu',
  btn_cancel: 'Hủy',
  btn_reset:  'Đặt lại',
  loading:    'Đang tải…',
};

const en: typeof vi = {
  nav_overview:        'Recruitment Overview',
  nav_upload:          'Upload Candidates',
  nav_results:         'Analysis Results',
  nav_analytics:       'Detailed Analytics',
  nav_chatbot:         'AI Recruitment Assistant',
  nav_feedback:        'AI Feedback',
  nav_jd_standardizer: 'JD Standardizer',
  nav_history:         'CV Filter History',
  nav_salary:          'Salary Analysis',
  nav_library:         'CV Library',
  nav_selected:        'Selected Candidates',
  nav_settings:        'Settings',
  nav_help:            'Help',
  nav_logout:          'Log out',
  nav_new_session:     'New Session',

  user_docs:        'Documentation & Guides',
  user_faq:         'Frequently Asked Questions',
  user_security:    'Security & Compliance',
  user_privacy:     'Privacy Policy',
  user_terms:       'Terms of Service',

  settings_title:        'Settings',
  settings_tab_general:  'General',
  settings_tab_profile:  'Profile',
  settings_tab_workflow: 'Workflow',
  settings_tab_notif:    'Notifications',
  settings_tab_data:     'Data',
  settings_tab_team:     'Set Up Team',
  settings_tab_library:  'CV Library',

  settings_section_ui:           'INTERFACE',
  settings_theme_label:          'Color theme',
  settings_theme_light:          'Light',
  settings_theme_dark:           'Dark',
  settings_theme_system:         'System',
  settings_section_language:     'LANGUAGE',
  settings_language_desc:        'Interface display language. Applied after page reload.',
  settings_language_vi:          'Tiếng Việt',
  settings_language_en:          'English',
  settings_section_accessibility:'ACCESSIBILITY',
  settings_reduced_motion:       'Reduce motion',
  settings_reduced_motion_desc:  'Disable animations and transitions.',

  settings_saving:    'Saving',
  settings_synced:    'Synced',
  settings_sync_error:'Sync error',
  settings_not_authed:'Not signed in',
  settings_autosave_hint: 'Changes are automatically saved to the database.',
  settings_close:     'Close',

  btn_close:  'Close',
  btn_save:   'Save',
  btn_cancel: 'Cancel',
  btn_reset:  'Reset',
  loading:    'Loading…',
};

export const translations: Record<Locale, typeof vi> = { 'vi-VN': vi, 'en-US': en };
export type TranslationKey = keyof typeof vi;
