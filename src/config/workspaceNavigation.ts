import {
  BarChart3,
  Bot,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  SlidersHorizontal,
  Sparkles,
  Upload,
  User,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { TranslationKey } from '@/i18n/translations';

export type WorkspaceNavigationIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

export interface WorkspaceNavigationItem {
  labelKey: TranslationKey;
  path: string;
  icon: WorkspaceNavigationIcon;
  showInSidebar?: boolean;
  showInSearch?: boolean;
}

export interface WorkspaceNavigationSection {
  id: string;
  labelKey: TranslationKey;
  icon: WorkspaceNavigationIcon;
  items: WorkspaceNavigationItem[];
}

export const workspaceNavigationSections: WorkspaceNavigationSection[] = [
  {
    id: 'overview',
    labelKey: 'nav_section_overview',
    icon: LayoutDashboard,
    items: [{ labelKey: 'nav_overview', path: '/workspace', icon: LayoutDashboard }],
  },
  {
    id: 'screening',
    labelKey: 'nav_section_screening',
    icon: ClipboardCheck,
    items: [
      { labelKey: 'nav_jd_input', path: '/jd', icon: FileCheck2, showInSidebar: false, showInSearch: false },
      { labelKey: 'nav_upload', path: '/upload', icon: Upload },
      { labelKey: 'nav_weights', path: '/weights', icon: SlidersHorizontal, showInSidebar: false, showInSearch: false },
      { labelKey: 'nav_results', path: '/analysis', icon: ClipboardCheck },
      { labelKey: 'nav_analytics', path: '/detailed-analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'candidates',
    labelKey: 'nav_section_candidates',
    icon: Users,
    items: [
      { labelKey: 'nav_library', path: '/records', icon: User },
      { labelKey: 'nav_contact', path: '/contact-candidates', icon: Mail },
    ],
  },
  {
    id: 'tools',
    labelKey: 'nav_section_tools',
    icon: Sparkles,
    items: [
      { labelKey: 'nav_chatbot', path: '/chatbot', icon: Bot },
      { labelKey: 'nav_jd_standardizer', path: '/jd-standardizer', icon: Sparkles },
      { labelKey: 'nav_jd_templates', path: '/jd-templates', icon: FileText },
      { labelKey: 'nav_feedback', path: '/feedback', icon: MessageSquareText },
    ],
  },
];

export const workspaceNavigationItems = workspaceNavigationSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, sectionId: section.id, sectionLabelKey: section.labelKey })),
);

export function getWorkspaceNavigationEntry(pathname: string) {
  const normalizedPath = pathname === '/' ? '/workspace' : pathname;
  return workspaceNavigationItems.find((item) => item.path === normalizedPath) ?? workspaceNavigationItems[0];
}
