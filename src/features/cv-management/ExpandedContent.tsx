import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  FileCheck2,
  GraduationCap,
  Hourglass,
  Languages,
  Target,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { Candidate, DetailedScore, UploadedFileRecord } from '@/types';
import { analyzeExperience, extractJDRequirements, compareEvidence } from '@/services/screening/frontendInsights';
import { UploadedFilesService } from '@/services/data-sync/uploadedFilesService';

// Ã¢â€â‚¬Ã¢â€â‚¬ PhÃƒÂ¢n loÃ¡ÂºÂ¡i tiÃƒÂªu chÃƒÂ­ Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const BASIC_CRITERIA = [
  'PhÃƒÂ¹ hÃ¡Â»Â£p JD (Job Fit)', 'Kinh nghiÃ¡Â»â€¡m', 'KÃ¡Â»Â¹ nÃ„Æ’ng', 'ThÃƒÂ nh tÃ¡Â»Â±u/KPI',
  'HÃ¡Â»Âc vÃ¡ÂºÂ¥n', 'NgÃƒÂ´n ngÃ¡Â»Â¯', 'ChuyÃƒÂªn nghiÃ¡Â»â€¡p', 'GÃ¡ÂºÂ¯n bÃƒÂ³ & LÃ¡Â»â€¹ch sÃ¡Â»Â­ CV', 'PhÃƒÂ¹ hÃ¡Â»Â£p vÃ„Æ’n hoÃƒÂ¡',
  'HÃ¡Â»â€¡ sÃ¡Â»â€˜ uy tÃƒÂ­n cÃƒÂ´ng ty', // chuyÃ¡Â»Æ’n vÃ¡Â»Â cÃ†Â¡ bÃ¡ÂºÂ£n
];

const REMOVED_CRITERIA = [
  'MÃ¡Â»Â©c Ã„â€˜Ã¡Â»â„¢ trung thÃƒÂ nh',
  'Ky nang hanh dong & chu dong',
  'Trinh bay STAR & Ket qua',
  'Ky nang chuyen doi (Skill Graph)',
  'Tiem nang phat trien (Career Velocity)',
];

// Thang diem chu?n
const BASIC_TOTAL_MAX = 80;    // 10 tieu chi c? b?n c?ng l?i t?i ?a 80
const BASIC_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = {
  'PhÃƒÂ¹ hÃ¡Â»Â£p JD (Job Fit)': {
    what: 'So sÃƒÂ¡nh tÃ¡Â»Â« khÃƒÂ³a JD vÃ¡Â»â€ºi nÃ¡Â»â„¢i dung CV: kÃ¡Â»Â¹ nÃ„Æ’ng, cÃƒÂ´ng nghÃ¡Â»â€¡, ngÃƒÂ nh nghÃ¡Â»Â, yÃƒÂªu cÃ¡ÂºÂ§u vai trÃƒÂ².',
    why: 'TiÃƒÂªu chÃƒÂ­ nÃƒÂ y trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p phÃ¡ÂºÂ£n ÃƒÂ¡nh Ã¡Â»Â©ng viÃƒÂªn cÃƒÂ³ Ã„â€˜ÃƒÂ¡p Ã¡Â»Â©ng Ã„â€˜ÃƒÂºng vÃ¡Â»â€¹ trÃƒÂ­ tuyÃ¡Â»Æ’n dÃ¡Â»Â¥ng hay khÃƒÂ´ng Ã¢â‚¬â€ trÃ¡Â»Âng sÃ¡Â»â€˜ cao nhÃ¡ÂºÂ¥t.',
    signals: ['TrÃƒÂ¹ng Ã„â€˜Ã¡Â»â€œng kÃ¡Â»Â¹ nÃ„Æ’ng bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c trong JD', 'TÃƒÂªn ngÃƒÂ nh/lÃ„Â©nh vÃ¡Â»Â±c giÃ¡Â»â€˜ng nhau', 'TrÃƒÂ¬nh Ã„â€˜Ã¡Â»â„¢ yÃƒÂªu cÃ¡ÂºÂ§u khÃ¡Â»â€ºp (mÃƒÂ  khÃƒÂ´ng quÃƒÂ¡ cao/thÃ¡ÂºÂ¥p)'],
  },
  'Kinh nghiÃ¡Â»â€¡m': {
    what: 'TÃ¡Â»â€¢ng sÃ¡Â»â€˜ nÃ„Æ’m kinh nghiÃ¡Â»â€¡m thÃ¡Â»Â±c tÃ¡ÂºÂ¿ cÃƒÂ³ liÃƒÂªn quan Ã„â€˜Ã¡ÂºÂ¿n vÃ¡Â»â€¹ trÃƒÂ­ hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i.',
    why: 'Kinh nghiÃ¡Â»â€¡m lÃƒÂ  chÃ¡Â»â€° bÃƒÂ¡o nÃ¡ÂºÂ±ng nÃ¡Â»Â nhÃ¡ÂºÂ¥t cho khÃ¡ÂºÂ£ nÃ„Æ’ng thÃ¡Â»Â±c chiÃ¡ÂºÂ¿n Ã¢â‚¬â€ giÃ¡ÂºÂ£m thÃ¡Â»Âi gian onboard.',
    signals: ['SÃ¡Â»â€˜ nÃ„Æ’m kinh nghiÃ¡Â»â€¡m khÃ¡Â»â€ºp yÃƒÂªu cÃ¡ÂºÂ§u JD', 'Vai trÃƒÂ² tÃ†Â°Ã†Â¡ng Ã„â€˜Ã†Â°Ã†Â¡ng Ã¡Â»Å¸ cÃƒÂ´ng ty trÃ†Â°Ã¡Â»â€ºc', 'Ã„ÂÃƒÂ£ lÃƒÂ m viÃ¡Â»â€¡c vÃ¡Â»â€ºi cÃƒÂ´ng nghÃ¡Â»â€¡/stack tÃ†Â°Ã†Â¡ng tÃ¡Â»Â±'],
  },
  'KÃ¡Â»Â¹ nÃ„Æ’ng': {
    what: 'KÃ¡Â»Â¹ nÃ„Æ’ng cÃ¡Â»Â©ng (technical) vÃƒÂ  mÃ¡Â»Âm (soft) Ã„â€˜Ã†Â°Ã¡Â»Â£c liÃ¡Â»â€¡t kÃƒÂª cÃƒÂ³ khÃ¡Â»â€ºp vÃ¡Â»â€ºi yÃƒÂªu cÃ¡ÂºÂ§u khÃƒÂ´ng.',
    why: 'KÃ¡Â»Â¹ nÃ„Æ’ng Ã„â€˜ÃƒÂºng giÃƒÂºp Ã¡Â»Â©ng viÃƒÂªn lÃƒÂ m viÃ¡Â»â€¡c hiÃ¡Â»â€¡u quÃ¡ÂºÂ£ ngay tÃ¡Â»Â« ngÃƒÂ y Ã„â€˜Ã¡ÂºÂ§u, giÃ¡ÂºÂ£m chi phÃƒÂ­ Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o.',
    signals: ['CÃƒÂ´ng cÃ¡Â»Â¥/framework Ã„â€˜Ã†Â°Ã¡Â»Â£c dÃƒÂ¹ng tÃƒÂ­ch cÃ¡Â»Â±c trong JD', 'KhÃƒÂ´ng chÃ¡Â»â€° liÃ¡Â»â€¡t kÃƒÂª mÃƒÂ  cÃƒÂ³ dÃ¡ÂºÂ«n chÃ¡Â»Â©ng sÃ¡Â»Â­ dÃ¡Â»Â¥ng', 'KÃ¡Â»Â¹ nÃ„Æ’ng Ã„â€˜Ã†Â°Ã¡Â»Â£c xÃƒÂ¡c nhÃ¡ÂºÂ­n qua dÃ¡Â»Â± ÃƒÂ¡n cÃ¡Â»Â¥ thÃ¡Â»Æ’'],
  },
  'ThÃƒÂ nh tÃ¡Â»Â±u/KPI': {
    what: 'KÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ Ã„â€˜Ã¡Â»â€¹nh lÃ†Â°Ã¡Â»Â£ng Ã„â€˜Ã¡ÂºÂ¡t Ã„â€˜Ã†Â°Ã¡Â»Â£c: tÃ„Æ’ng trÃ†Â°Ã¡Â»Å¸ng, tiÃ¡ÂºÂ¿t kiÃ¡Â»â€¡m, tÃ¡Â»â€˜i Ã†Â°u, tÃ¡ÂºÂ¡o ra giÃƒÂ¡ trÃ¡Â»â€¹ Ã„â€˜o Ã„â€˜Ã†Â°Ã¡Â»Â£c.',
    why: 'ThÃƒÂ nh tÃ¡Â»Â±u sÃ¡Â»â€˜ liÃ¡Â»â€¡u cÃ¡Â»Â¥ thÃ¡Â»Æ’ lÃƒÂ  bÃ¡ÂºÂ±ng chÃ¡Â»Â©ng mÃ¡ÂºÂ¡nh nhÃ¡ÂºÂ¥t cho nÃ„Æ’ng lÃ¡Â»Â±c thÃ¡Â»Â±c cÃ¡Â»Â§a Ã¡Â»Â©ng viÃƒÂªn.',
    signals: ['TÃ„Æ’ng doanh thu/hiÃ¡Â»â€¡u quÃ¡ÂºÂ£ bÃ¡ÂºÂ±ng con sÃ¡Â»â€˜ cÃ¡Â»Â¥ thÃ¡Â»Æ’', 'TiÃ¡ÂºÂ¿t kiÃ¡Â»â€¡m chi phÃƒÂ­ hoÃ¡ÂºÂ·c thÃ¡Â»Âi gian (%)', 'Ã„ÂÃ¡ÂºÂ¡t hoÃ¡ÂºÂ·c vÃ†Â°Ã¡Â»Â£t KPI Ã„â€˜Ã†Â°Ã¡Â»Â£c giao'],
  },
  'HÃ¡Â»Âc vÃ¡ÂºÂ¥n': {
    what: 'BÃ¡ÂºÂ±ng cÃ¡ÂºÂ¥p, trÃ†Â°Ã¡Â»Âng hÃ¡Â»Âc, chuyÃƒÂªn ngÃƒÂ nh vÃƒÂ  chÃ¡Â»Â©ng chÃ¡Â»â€° chuyÃƒÂªn mÃƒÂ´n cÃƒÂ³ Ã„â€˜ÃƒÂ¡p Ã¡Â»Â©ng yÃƒÂªu cÃ¡ÂºÂ§u khÃƒÂ´ng.',
    why: 'HÃ¡Â»Âc vÃ¡ÂºÂ¥n phÃƒÂ¹ hÃ¡Â»Â£p Ã„â€˜Ã¡ÂºÂ£m bÃ¡ÂºÂ£o nÃ¡Â»Ân tÃ¡ÂºÂ£ng lÃƒÂ½ thuyÃ¡ÂºÂ¿t cho cÃƒÂ´ng viÃ¡Â»â€¡c Ã¢â‚¬â€ Ã„â€˜Ã¡ÂºÂ·c biÃ¡Â»â€¡t quan trÃ¡Â»Âng vÃ¡Â»â€ºi ngÃƒÂ nh kÃ¡Â»Â¹ thuÃ¡ÂºÂ­t.',
    signals: ['ChuyÃƒÂªn ngÃƒÂ nh Ã„â€˜ÃƒÂºng ngÃƒÂ nh nghÃ¡Â»Â', 'TrÃ†Â°Ã¡Â»Âng Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o uy tÃƒÂ­n (cÃ¡Â»â„¢ng Ã„â€˜iÃ¡Â»Æ’m)', 'ChÃ¡Â»Â©ng chÃ¡Â»â€° chuyÃƒÂªn nghiÃ¡Â»â€¡p: AWS, CFA, PMP...'],
  },
  'NgÃƒÂ´n ngÃ¡Â»Â¯': {
    what: 'TrÃƒÂ¬nh Ã„â€˜Ã¡Â»â„¢ ngoÃ¡ÂºÂ¡i ngÃ¡Â»Â¯ Ã„â€˜Ã†Â°Ã¡Â»Â£c kÃƒÂª khai so vÃ¡Â»â€ºi yÃƒÂªu cÃ¡ÂºÂ§u ngÃƒÂ´n ngÃ¡Â»Â¯ cÃ¡Â»Â§a JD.',
    why: 'VÃ¡Â»â€¹ trÃƒÂ­ quÃ¡Â»â€˜c tÃ¡ÂºÂ¿ hoÃ¡ÂºÂ·c cÃƒÂ³ Ã„â€˜Ã¡Â»â€˜i tÃƒÂ¡c nÃ†Â°Ã¡Â»â€ºc ngoÃƒÂ i cÃ¡ÂºÂ§n ngÃƒÂ´n ngÃ¡Â»Â¯ Ã„â€˜Ã¡Â»Â§ mÃ¡ÂºÂ¡nh Ã„â€˜Ã¡Â»Æ’ giao tiÃ¡ÂºÂ¿p hiÃ¡Â»â€¡u quÃ¡ÂºÂ£.',
    signals: ['TiÃ¡ÂºÂ¿ng Anh B2+ / IELTS 6.5+ nÃ¡ÂºÂ¿u JD yÃƒÂªu cÃ¡ÂºÂ§u', 'NgoÃ¡ÂºÂ¡i ngÃ¡Â»Â¯ hiÃ¡ÂºÂ¿m (NhÃ¡ÂºÂ­t, HÃƒÂ n) lÃƒÂ  lÃ¡Â»Â£i thÃ¡ÂºÂ¿', 'CÃƒÂ³ chÃ¡Â»Â©ng chÃ¡Â»â€° ngÃƒÂ´n ngÃ¡Â»Â¯ uy tÃƒÂ­n'],
  },
  'ChuyÃƒÂªn nghiÃ¡Â»â€¡p': {
    what: 'Ã„ÂÃƒÂ¡nh giÃƒÂ¡ chÃ¡ÂºÂ¥t lÃ†Â°Ã¡Â»Â£ng trÃƒÂ¬nh bÃƒÂ y CV: cÃ¡ÂºÂ¥u trÃƒÂºc rÃƒÂµ rÃƒÂ ng, khÃƒÂ´ng lÃ¡Â»â€”i chÃƒÂ­nh tÃ¡ÂºÂ£, format nhÃ¡ÂºÂ¥t quÃƒÂ¡n.',
    why: 'CV chuyÃƒÂªn nghiÃ¡Â»â€¡p phÃ¡ÂºÂ£n ÃƒÂ¡nh tÃƒÂ¡c phong lÃƒÂ m viÃ¡Â»â€¡c Ã¢â‚¬â€ Ã¡Â»Â©ng viÃƒÂªn Ã„â€˜Ã¡ÂºÂ§u tÃ†Â° vÃƒÂ o chi tiÃ¡ÂºÂ¿t sÃ¡ÂºÂ½ chÃ„Æ’m chÃ¡Â»â€° hÃ†Â¡n trong cÃƒÂ´ng viÃ¡Â»â€¡c.',
    signals: ['KhÃƒÂ´ng cÃƒÂ³ lÃ¡Â»â€”i chÃƒÂ­nh tÃ¡ÂºÂ£, ngÃ¡Â»Â¯ phÃƒÂ¡p', 'Layout gÃ¡Â»Ân gÃƒÂ ng, cÃƒÂ³ phÃƒÂ¢n mÃ¡Â»Â¥c rÃƒÂµ rÃƒÂ ng', 'KhÃƒÂ´ng insert thÃƒÂ´ng tin khÃƒÂ´ng liÃƒÂªn quan'],
  },
  'GÃ¡ÂºÂ¯n bÃƒÂ³ & LÃ¡Â»â€¹ch sÃ¡Â»Â­ CV': {
    what: 'PhÃƒÂ¢n tÃƒÂ­ch xu hÃ†Â°Ã¡Â»â€ºng thay Ã„â€˜Ã¡Â»â€¢i cÃƒÂ´ng viÃ¡Â»â€¡c: sÃ¡Â»â€˜ lÃ¡ÂºÂ§n chuyÃ¡Â»Æ’n, tÃ¡ÂºÂ§n suÃ¡ÂºÂ¥t vÃƒÂ  lÃƒÂ½ do cÃƒÂ³ hÃ¡Â»Â£p lÃƒÂ½.',
    why: 'LÃ¡Â»â€¹ch sÃ¡Â»Â­ CV cho thÃ¡ÂºÂ¥y Ã¡Â»Â©ng viÃƒÂªn cÃƒÂ³ cam kÃ¡ÂºÂ¿t dÃƒÂ i hÃ¡ÂºÂ¡n hay khÃƒÂ´ng Ã¢â‚¬â€ trÃƒÂ¡nh tuyÃ¡Â»Æ’n dÃ¡Â»Â¥ng rÃ¡Â»â€œi nghÃ¡Â»â€° sÃ¡Â»â€ºm.',
    signals: ['KhÃƒÂ´ng chuyÃ¡Â»Æ’n viÃ¡Â»â€¡c liÃƒÂªn tÃ¡Â»Â¥c (< 1 nÃ„Æ’m/cÃƒÂ´ng ty)', 'KhoÃ¡ÂºÂ£ng trÃ¡Â»â€˜ng giÃ¡Â»Â¯a cÃƒÂ¡c cÃƒÂ´ng viÃ¡Â»â€¡c cÃƒÂ³ giÃ¡ÂºÂ£i thÃƒÂ­ch hÃ¡Â»Â£p lÃƒÂ½', 'Xu hÃ†Â°Ã¡Â»â€ºng tÃ„Æ’ng trÃ†Â°Ã¡Â»Å¸ng rÃƒÂµ rÃƒÂ ng qua cÃƒÂ¡c cÃƒÂ´ng ty'],
  },
  'PhÃƒÂ¹ hÃ¡Â»Â£p vÃ„Æ’n hoÃƒÂ¡': {
    what: 'DÃ¡ÂºÂ¥u hiÃ¡Â»â€¡u vÃ„Æ’n hÃƒÂ³a phÃƒÂ¹ hÃ¡Â»Â£p vÃ¡Â»â€ºi cÃƒÂ´ng ty: teamwork, innovation, agile, leadership...',
    why: 'PhÃƒÂ¹ hÃ¡Â»Â£p vÃ„Æ’n hÃƒÂ³a Ã¡ÂºÂ£nh hÃ†Â°Ã¡Â»Å¸ng gÃ¡ÂºÂ§n 50% quyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh gÃ¡Â»Â¯ chÃƒÂ¢n Ã¢â‚¬â€ thiÃ¡ÂºÂ¿u sÃ¡Â»Â± fit nÃƒÂ y Ã„â€˜Ã¡Â»â€œng nghÃ„Â©a turnover cao.',
    signals: ['HoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng ngoÃ¡ÂºÂ¡i khÃƒÂ³a, tÃƒÂ¬nh nguyÃ¡Â»â€¡n, community', 'Phong cÃƒÂ¡ch viÃ¡ÂºÂ¿t CV reflect vÃ„Æ’n hÃƒÂ³a', 'VÃ¡Â»â€¹ trÃƒÂ­ cÃ…Â© cÃƒÂ³ vÃ„Æ’n hÃƒÂ³a tÃ†Â°Ã†Â¡ng Ã„â€˜Ã¡Â»â€œng'],
  },
  'HÃ¡Â»â€¡ sÃ¡Â»â€˜ uy tÃƒÂ­n cÃƒÂ´ng ty': {
    what: 'AI phÃƒÂ¢n loÃ¡ÂºÂ¡i tÃ¡Â»Â«ng cÃƒÂ´ng ty Ã„â€˜ÃƒÂ£ lÃƒÂ m thÃƒÂ nh Tier 1/2/3 vÃƒÂ  ÃƒÂ¡p hÃ¡Â»â€¡ sÃ¡Â»â€˜ nhÃƒÂ¢n tÃ†Â°Ã†Â¡ng Ã¡Â»Â©ng vÃƒÂ o Ã„â€˜iÃ¡Â»Æ’m kinh nghiÃ¡Â»â€¡m.',
    why: 'CÃƒÂ¹ng bÃ¡ÂºÂ¡n nÃ„Æ’m kinh nghiÃ¡Â»â€¡m: ngÃ†Â°Ã¡Â»Âi lÃƒÂ m Google vÃƒÂ  cÃƒÂ´ng ty vÃƒÂ´ danh chÃ¡ÂºÂ¥t lÃ†Â°Ã¡Â»Â£ng Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o khÃƒÂ¡c rÃ¡ÂºÂ¥t lÃ¡Â»â€ºn.',
    signals: ['Tier 1 (x1.5): FAANG, Top Consulting (McKinsey, BCG), Goldman Sachs', 'Tier 2 (x1.2): CÃƒÂ¡c cÃƒÂ´ng ty Fortune 500, Big 4, cÃƒÂ´ng ty tech hÃƒÂ ng Ã„â€˜Ã¡ÂºÂ§u ViÃ¡Â»â€¡t Nam', 'Tier 3 (x1.0): CÃƒÂ´ng ty thÃƒÂ´ng thÃ†Â°Ã¡Â»Âng | Startup chÃ†Â°a nÃ¡Â»â€¢i tiÃ¡ÂºÂ¿ng (khÃƒÂ´ng trÃ¡Â»Â« Ã„â€˜iÃ¡Â»Æ’m)'],
  },
};


const CRITERION_DESCRIPTIONS: Record<string, { what: string; why: string; signals: string[] }> = BASIC_DESCRIPTIONS;

const CARD_CRITERIA_META: { [key: string]: { Icon: LucideIcon; color: string; accent: string } } = {
  [BASIC_CRITERIA[0]]: { Icon: Target, color: 'text-sky-400', accent: 'border-sky-500/30 bg-sky-500/5' },
  [BASIC_CRITERIA[1]]: { Icon: BriefcaseBusiness, color: 'text-green-400', accent: 'border-green-500/30 bg-green-500/5' },
  [BASIC_CRITERIA[2]]: { Icon: Wrench, color: 'text-purple-400', accent: 'border-purple-500/30 bg-purple-500/5' },
  [BASIC_CRITERIA[3]]: { Icon: Award, color: 'text-yellow-400', accent: 'border-yellow-500/30 bg-yellow-500/5' },
  [BASIC_CRITERIA[4]]: { Icon: GraduationCap, color: 'text-indigo-400', accent: 'border-indigo-500/30 bg-indigo-500/5' },
  [BASIC_CRITERIA[5]]: { Icon: Languages, color: 'text-orange-400', accent: 'border-orange-500/30 bg-orange-500/5' },
  [BASIC_CRITERIA[6]]: { Icon: FileCheck2, color: 'text-cyan-400', accent: 'border-cyan-500/30 bg-cyan-500/5' },
  [BASIC_CRITERIA[7]]: { Icon: Hourglass, color: 'text-lime-400', accent: 'border-lime-500/30 bg-lime-500/5' },
  [BASIC_CRITERIA[8]]: { Icon: UsersRound, color: 'text-pink-400', accent: 'border-pink-500/30 bg-pink-500/5' },
  [BASIC_CRITERIA[9]]: { Icon: Building2, color: 'text-emerald-400', accent: 'border-emerald-500/30 bg-emerald-500/5' },
};

// ?? Accordion d?ng chung ?????????????????????????????????????????????????????

// ?? Accordion d?ng chung ?????????????????????????????????????????????????????

function normalizeAscii(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getRecordValueByAliases(record: Record<string, unknown>, aliases: string[]): string {
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined || !String(value).trim()) {
      continue;
    }

    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (aliases.includes(normalizedKey)) {
      return String(value).trim();
    }
  }

  return '';
}

function getRawRecordValueByAliases(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (aliases.includes(normalizedKey)) {
      return value;
    }
  }

  return undefined;
}

function getDetailCriterion(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['tieu chi', 'tieuchi', 'criterion']);
}

function getDetailScore(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['diem', 'score']);
}

function getDetailFormula(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['cong thuc', 'formula']);
}

function getDetailEvidence(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['dan chung', 'evidence']);
}

function getDetailExplanation(item: DetailedScore): string {
  const record = item as unknown as Record<string, unknown>;
  return getRecordValueByAliases(record, ['giai thich', 'explanation']);
}

const MISSING_DETAIL_EVIDENCE = 'AI chÃ†Â°a trÃ¡ÂºÂ£ vÃ¡Â»Â dÃ¡ÂºÂ«n chÃ¡Â»Â©ng cÃ¡Â»Â¥ thÃ¡Â»Æ’ cho tiÃƒÂªu chÃƒÂ­ nÃƒÂ y.';
const CV_TEXT_FIELD_ALIASES = new Set([
  'cv text',
  'cvtext',
  'resume text',
  'resumetext',
  'extracted text',
  'extractedtext',
  'raw text',
  'rawtext',
  'full text',
  'fulltext',
  'content',
  'text',
]);
const EXPERIENCE_TEXT_FIELD_ALIASES = new Set([
  'experience',
  'work experience',
  'employment history',
  'kinh nghiem',
  'qua trinh cong tac',
  'lich su lam viec',
]);
const MONTH_NAME_TOKEN = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|thg\\.?\\s*\\d{1,2}|thÃƒÂ¡ng\\s*\\d{1,2})';
const TIMELINE_DATE_TOKEN = `(?:(?:0?[1-9]|1[0-2])\\/\\d{4}|\\d{4}|${MONTH_NAME_TOKEN}\\s*\\/?\\s*\\d{4})`;
const TIMELINE_RANGE_REGEX = new RegExp(
  `(${TIMELINE_DATE_TOKEN})\\s*(?:-|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â|to|Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â¿n|tÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi)\\s*(${TIMELINE_DATE_TOKEN}|hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i|hien tai|nay|present|current)`,
  'i'
);

interface CareerTimelineItem {
  id: string;
  periodLabel: string;
  summary: string;
  companyName: string;
  isCurrent: boolean;
  durationMonths: number | null;
}

interface EducationSummary {
  institution: string;
  major: string;
  degree: string;
  rawLine: string;
}

const uploadedCvTextCache = new Map<string, string>();

function extractNestedCvText(value: unknown, depth: number = 0): string {
  if (depth > 5 || value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().length > 120 ? value.trim() : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractNestedCvText(item, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  if (typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;

  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (CV_TEXT_FIELD_ALIASES.has(normalizedKey) && typeof nestedValue === 'string' && nestedValue.trim().length > 120) {
      return nestedValue.trim();
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = extractNestedCvText(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return '';
}

function extractStructuredExperienceText(value: unknown, depth: number = 0): string {
  if (depth > 6 || value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().length > 24 ? value.trim() : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractStructuredExperienceText(item, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  if (typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;

  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = normalizeAscii(key).replace(/\s+/g, ' ');
    if (EXPERIENCE_TEXT_FIELD_ALIASES.has(normalizedKey)) {
      const matchedText = extractStructuredExperienceText(nestedValue, depth + 1);
      if (matchedText) {
        return matchedText;
      }
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = extractStructuredExperienceText(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return '';
}

function scoreUploadedFileMatch(file: UploadedFileRecord, candidate: Candidate): number {
  let score = 0;

  if (normalizeAscii(file.fileName) === normalizeAscii(candidate.fileName)) score += 6;
  if (file.candidateName && normalizeAscii(file.candidateName) === normalizeAscii(candidate.candidateName)) score += 4;
  if (file.jobPosition && candidate.jobTitle && normalizeAscii(file.jobPosition) === normalizeAscii(candidate.jobTitle)) score += 1;

  return score;
}

async function resolveCandidateCvText(candidate: Candidate): Promise<string> {
  if (candidate._cvText?.trim()) {
    return candidate._cvText.trim();
  }

  const cacheKey = `${candidate.fileName}::${candidate.candidateName}`;
  const cachedText = uploadedCvTextCache.get(cacheKey);
  if (cachedText) {
    return cachedText;
  }

  if (candidate._rawBatchJson) {
    try {
      const rawCandidate = JSON.parse(candidate._rawBatchJson) as unknown;
      const structuredExperience = extractStructuredExperienceText(rawCandidate);
      if (structuredExperience) {
        uploadedCvTextCache.set(cacheKey, structuredExperience);
        return structuredExperience;
      }
      const embeddedText = extractNestedCvText(rawCandidate);
      if (embeddedText && !looksLikeAnalysisPayload(embeddedText)) {
        uploadedCvTextCache.set(cacheKey, embeddedText);
        return embeddedText;
      }
    } catch {
      // Ignore malformed raw candidate payloads and continue with uploaded file lookup.
    }
  }

  const uploadedCvFiles = await UploadedFilesService.getUserFilesByType('cv', 200).catch(() => [] as UploadedFileRecord[]);
  const matchedFile = [...uploadedCvFiles]
    .map((file) => ({ file, score: scoreUploadedFileMatch(file, candidate) }))
    .filter((entry) => entry.score > 0 && entry.file.extractedText.trim())
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Number(right.file.lastAccessedAt || right.file.uploadedAt || 0) - Number(left.file.lastAccessedAt || left.file.uploadedAt || 0);
    })[0]?.file;

  if (!matchedFile?.extractedText.trim()) {
    return '';
  }

  uploadedCvTextCache.set(cacheKey, matchedFile.extractedText.trim());
  return matchedFile.extractedText.trim();
}

function cleanTimelineText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[|]+/g, ' Ã¢â‚¬Â¢ ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*Ã¢â‚¬Â¢\s*/g, ' Ã¢â‚¬Â¢ ')
    .replace(/^[Ã¢â‚¬Â¢\-Ã¢â‚¬â€œÃ¢â‚¬â€,:;\s]+/, '')
    .replace(/[Ã¢â‚¬Â¢\-Ã¢â‚¬â€œÃ¢â‚¬â€,:;\s]+$/, '')
    .trim();
}

function isLikelyTimelineHeading(line: string): boolean {
  const normalized = normalizeAscii(line);
  return [
    'kinh nghiem',
    'work experience',
    'experience',
    'employment history',
    'lich su lam viec',
    'qua trinh cong tac',
    'projects',
    'du an',
    'hoc van',
    'education',
    'skills',
    'ky nang',
  ].some((keyword) => normalized === keyword || normalized.startsWith(`${keyword} `));
}

function formatPeriodLabel(start: string, end: string): string {
  const normalizedEnd = /^(hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i|hien tai|nay|present|current)$/i.test(end.trim()) ? 'HiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i' : end.trim();
  return `TÃ¡Â»Â« ${start.trim()} Ã„â€˜Ã¡ÂºÂ¿n ${normalizedEnd}`;
}

function parseTimelineDateToken(token: string, isEnd: boolean): { year: number; month: number } | null {
  const trimmed = token.trim();
  const normalized = normalizeAscii(trimmed);

  if (/^(hien tai|present|current|nay)$/.test(normalized)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  const monthYearMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    const month = Number.parseInt(monthYearMatch[1], 10);
    const year = Number.parseInt(monthYearMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      year: Number.parseInt(yearMatch[1], 10),
      month: isEnd ? 12 : 1,
    };
  }

  const monthNameMatch = normalized.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|thg\.?\s*(\d{1,2})|thang\s*(\d{1,2}))\s*\/?\s*(\d{4})$/
  );
  if (monthNameMatch) {
    const monthMap: Record<string, number> = {
      jan: 1,
      january: 1,
      feb: 2,
      february: 2,
      mar: 3,
      march: 3,
      apr: 4,
      april: 4,
      may: 5,
      jun: 6,
      june: 6,
      jul: 7,
      july: 7,
      aug: 8,
      august: 8,
      sep: 9,
      sept: 9,
      september: 9,
      oct: 10,
      october: 10,
      nov: 11,
      november: 11,
      dec: 12,
      december: 12,
    };

    const monthWord = monthNameMatch[1];
    const monthFromWord = monthMap[monthWord];
    const monthFromNumericWord = Number.parseInt(monthNameMatch[2] || monthNameMatch[3] || '', 10);
    const month = monthFromWord || monthFromNumericWord;
    const year = Number.parseInt(monthNameMatch[4], 10);

    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

function getTimelineDurationMonths(start: string, end: string): number | null {
  const startDate = parseTimelineDateToken(start, false);
  const endDate = parseTimelineDateToken(end, true);

  if (!startDate || !endDate) {
    return null;
  }

  const monthSpan = (endDate.year - startDate.year) * 12 + (endDate.month - startDate.month) + 1;
  return monthSpan > 0 ? monthSpan : null;
}

function formatTimelineDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} nÃ„Æ’m ${remainingMonths} thÃƒÂ¡ng`;
  }

  if (years > 0) {
    return `${years} nÃ„Æ’m`;
  }

  return `${remainingMonths} thÃƒÂ¡ng`;
}

function matchTimelineRange(value: string): RegExpMatchArray | null {
  return cleanTimelineText(value).match(TIMELINE_RANGE_REGEX);
}

function dedupeCareerTimelineItems(items: CareerTimelineItem[]): CareerTimelineItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${normalizeAscii(item.periodLabel)}::${normalizeAscii(item.companyName || item.summary)}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 8);
}

function formatTimelineEvidenceLine(entry: CareerTimelineItem): string {
  const company = entry.companyName || entry.summary || 'KhÃƒÂ´ng rÃƒÂµ cÃƒÂ´ng ty';
  const duration = entry.durationMonths ? `, tÃ¡Â»â€¢ng thÃ¡Â»Âi gian khoÃ¡ÂºÂ£ng ${formatTimelineDuration(entry.durationMonths)}` : '';
  return `${company}: ${entry.periodLabel}${duration}`;
}

function isGenericTimelineEvidence(value: string): boolean {
  const normalized = normalizeAscii(value);
  return (
    !matchTimelineRange(value) &&
    (
      normalized.includes('lam viec tai') ||
      normalized.includes('moi noi') ||
      normalized.includes('cong ty') ||
      normalized.includes('on dinh')
    )
  );
}

function looksLikeAnalysisPayload(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.includes('"analysis"') ||
    trimmed.includes('"softFilterWarnings"') ||
    trimmed.includes('"detectedLocation"') ||
    trimmed.includes('"Tong diem"') ||
    trimmed.includes('"TÃ¡Â»â€¢ng Ã„â€˜iÃ¡Â»Æ’m"')
  );
}

function guessTimelineCompany(primary: string, secondary: string): { companyName: string; detail: string } {
  const first = cleanTimelineText(primary);
  const second = cleanTimelineText(secondary);

  const inlineAtMatch = first.match(/^(.+?)\s+(?:at|tÃ¡ÂºÂ¡i)\s+(.+)$/i);
  if (inlineAtMatch) {
    return {
      companyName: cleanTimelineText(inlineAtMatch[2]),
      detail: cleanTimelineText(inlineAtMatch[1]),
    };
  }

  const candidates = [first, second].filter(Boolean);
  if (candidates.length === 0) {
    return { companyName: '', detail: '' };
  }

  if (candidates.length === 1) {
    return { companyName: '', detail: candidates[0] };
  }

  const companyHintRegex = /\b(company|co\.|corp|corporation|group|studio|solutions|software|bank|university|college|school|hospital|lab|labs|jsc|inc|llc|ltd|tnhh|tÃ¡ÂºÂ­p Ã„â€˜oÃƒÂ n|cÃƒÂ´ng ty|ngÃƒÂ¢n hÃƒÂ ng|trÃ†Â°Ã¡Â»Âng|viÃ¡Â»â€¡n|bÃ¡Â»â€¡nh viÃ¡Â»â€¡n)\b/i;
  const roleHintRegex = /\b(intern|developer|engineer|manager|director|lead|leader|consultant|analyst|designer|specialist|executive|architect|thÃ¡Â»Â±c tÃ¡ÂºÂ­p|nhÃƒÂ¢n viÃƒÂªn|chuyÃƒÂªn viÃƒÂªn|quÃ¡ÂºÂ£n lÃƒÂ½|trÃ†Â°Ã¡Â»Å¸ng|giÃƒÂ¡m Ã„â€˜Ã¡Â»â€˜c|kÃ¡Â»Â¹ sÃ†Â°|lÃ¡ÂºÂ­p trÃƒÂ¬nh viÃƒÂªn)\b/i;

  const scoreCandidate = (value: string) => {
    const normalized = normalizeAscii(value);
    let score = 0;
    if (companyHintRegex.test(value) || companyHintRegex.test(normalized)) score += 4;
    if (!roleHintRegex.test(value) && !roleHintRegex.test(normalized)) score += 2;
    if (value.length <= 52) score += 1;
    if (!/[,:;]/.test(value)) score += 1;
    return score;
  };

  const [left, right] = candidates;
  const leftScore = scoreCandidate(left);
  const rightScore = scoreCandidate(right);

  if (leftScore === rightScore) {
    if (left.length <= right.length) {
      return { companyName: left, detail: right };
    }
    return { companyName: right, detail: left };
  }

  return leftScore > rightScore
    ? { companyName: left, detail: right }
    : { companyName: right, detail: left };
}

function extractCareerTimeline(text: string): CareerTimelineItem[] {
  const lines = text
    .split('\n')
    .map((line) => cleanTimelineText(line))
    .filter(Boolean);

  const rangeRegex = new RegExp(
    `(${TIMELINE_DATE_TOKEN})\\s*(?:-|Ã¢â‚¬â€œ|Ã¢â‚¬â€|to|Ã„â€˜Ã¡ÂºÂ¿n|tÃ¡Â»â€ºi)\\s*(${TIMELINE_DATE_TOKEN}|hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i|hien tai|nay|present|current)`,
    'i'
  );
  const items: CareerTimelineItem[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    if (currentLine.length > 260 || looksLikeAnalysisPayload(currentLine)) {
      continue;
    }

    const dateMatch = currentLine.match(rangeRegex);
    if (!dateMatch) {
      continue;
    }

    const previousLine = lines[index - 1] || '';
    const nextLine = lines[index + 1] || '';
    const nextNextLine = lines[index + 2] || '';
    const strippedCurrent = cleanTimelineText(currentLine.replace(dateMatch[0], ''));

    let summary = strippedCurrent;
    let secondary = '';

    if (!summary || summary.length < 4) {
      if (nextLine && !rangeRegex.test(nextLine) && !isLikelyTimelineHeading(nextLine)) {
        summary = nextLine;
        if (nextNextLine && !rangeRegex.test(nextNextLine) && !isLikelyTimelineHeading(nextNextLine)) {
          secondary = nextNextLine;
        }
      } else if (previousLine && !rangeRegex.test(previousLine) && !isLikelyTimelineHeading(previousLine)) {
        summary = previousLine;
      }
    } else if (nextLine && !rangeRegex.test(nextLine) && !isLikelyTimelineHeading(nextLine)) {
      secondary = nextLine;
    }

    if (summary.length > 180 || looksLikeAnalysisPayload(summary)) {
      summary = '';
    }
    if (secondary.length > 180 || looksLikeAnalysisPayload(secondary)) {
      secondary = '';
    }

    const { companyName, detail } = guessTimelineCompany(summary, secondary);
    const combinedSummary = [detail]
      .map((item) => cleanTimelineText(item))
      .filter(Boolean)
      .join(' Ã¢â‚¬Â¢ ');

    if (!combinedSummary && !companyName) {
      continue;
    }

    items.push({
      id: `${dateMatch[1]}-${dateMatch[2]}-${index}`,
      periodLabel: formatPeriodLabel(dateMatch[1], dateMatch[2]),
      summary: combinedSummary || companyName,
      companyName,
      isCurrent: /^(hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i|hien tai|nay|present|current)$/i.test(dateMatch[2].trim()),
      durationMonths: getTimelineDurationMonths(dateMatch[1], dateMatch[2]),
    });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${normalizeAscii(item.periodLabel)}::${normalizeAscii(item.summary)}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 8);
}

function collectStringLeaves(value: unknown, depth: number = 0, output: string[] = []): string[] {
  if (depth > 6 || value === null || value === undefined) {
    return output;
  }

  if (typeof value === 'string') {
    const cleaned = cleanTimelineText(value);
    if (cleaned.length >= 4) {
      output.push(cleaned);
    }
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStringLeaves(item, depth + 1, output));
    return output;
  }

  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStringLeaves(item, depth + 1, output));
  }

  return output;
}

function buildTimelineItemFromParts(
  companyName: string,
  summary: string,
  start: string,
  end: string,
  index: number
): CareerTimelineItem | null {
  const cleanedStart = cleanTimelineText(start);
  const cleanedEnd = cleanTimelineText(end);
  const company = cleanTimelineText(companyName);
  const detail = cleanTimelineText(summary);

  if (!company && !detail) {
    return null;
  }

  if (!parseTimelineDateToken(cleanedStart, false) || !parseTimelineDateToken(cleanedEnd, true)) {
    return null;
  }

  return {
    id: `${cleanedStart}-${cleanedEnd}-structured-${index}`,
    periodLabel: formatPeriodLabel(cleanedStart, cleanedEnd),
    summary: detail || company,
    companyName: company,
    isCurrent: /^(hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i|hien tai|nay|present|current)$/i.test(cleanedEnd),
    durationMonths: getTimelineDurationMonths(cleanedStart, cleanedEnd),
  };
}

function extractCareerTimelineFromStructuredValue(value: unknown, depth: number = 0): CareerTimelineItem[] {
  if (depth > 7 || value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    return extractCareerTimeline(value);
  }

  if (Array.isArray(value)) {
    return dedupeCareerTimelineItems(value.flatMap((item) => extractCareerTimelineFromStructuredValue(item, depth + 1)));
  }

  if (typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const company = getRecordValueByAliases(record, [
    'company',
    'company name',
    'employer',
    'organization',
    'organisation',
    'cong ty',
    'ten cong ty',
    'don vi',
    'noi lam viec',
  ]);
  const role = getRecordValueByAliases(record, [
    'title',
    'role',
    'position',
    'job title',
    'chuc danh',
    'vi tri',
    'vi tri cong viec',
  ]);
  const start = getRecordValueByAliases(record, ['start', 'start date', 'from', 'tu', 'bat dau']);
  const end = getRecordValueByAliases(record, ['end', 'end date', 'to', 'den', 'ket thuc']) || 'HiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i';
  const period = getRecordValueByAliases(record, ['period', 'duration', 'time', 'timeline', 'thoi gian', 'khoang thoi gian']);
  const ownItems: CareerTimelineItem[] = [];

  if ((company || role) && start) {
    const item = buildTimelineItemFromParts(company, role, start, end, ownItems.length);
    if (item) ownItems.push(item);
  }

  if ((company || role) && period) {
    const range = matchTimelineRange(period);
    if (range) {
      const item = buildTimelineItemFromParts(company, role, range[1], range[2], ownItems.length);
      if (item) ownItems.push(item);
    }
  }

  const nestedItems = Object.values(record).flatMap((item) => extractCareerTimelineFromStructuredValue(item, depth + 1));
  return dedupeCareerTimelineItems([...ownItems, ...nestedItems]);
}

function extractCareerTimelineFromCandidatePayload(candidate: Candidate): CareerTimelineItem[] {
  const items: CareerTimelineItem[] = [];

  if (candidate._rawBatchJson) {
    try {
      const rawCandidate = JSON.parse(candidate._rawBatchJson) as unknown;
      items.push(...extractCareerTimelineFromStructuredValue(rawCandidate));
      collectStringLeaves(rawCandidate)
        .filter((line) => !looksLikeAnalysisPayload(line))
        .forEach((line) => items.push(...extractCareerTimeline(line)));
    } catch {
      // Ignore malformed raw payloads.
    }
  }

  return dedupeCareerTimelineItems(items);
}

function isGenericEducationValidation(value: string): boolean {
  const normalized = normalizeAscii(value).replace(/\s+/g, ' ').trim();
  return ['hop le', 'valid', 'khong hop le', 'invalid', 'phu hop'].includes(normalized.replace(/[.Ã£â‚¬â€š]+$/, ''));
}

function getEducationInstitutionFromLine(line: string): string {
  const cleaned = cleanTimelineText(line)
    .replace(/^(education|hoc van|hÃ¡Â»Âc vÃ¡ÂºÂ¥n|truong|trÃ†Â°Ã¡Â»Âng|co so dao tao|cÃ†Â¡ sÃ¡Â»Å¸ Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o)\s*[:Ã¯Â¼Å¡-]\s*/i, '')
    .trim();
  const [beforeDash] = cleaned.split(/\s[-Ã¢â‚¬â€œÃ¢â‚¬â€|]\s/);
  return cleanTimelineText(beforeDash || cleaned);
}

function extractEducationSummaryFromText(text: string): EducationSummary | null {
  const lines = text
    .split(/\n|Ã¢â‚¬Â¢|;|,/)
    .map((line) => cleanTimelineText(line))
    .filter((line) => line && line.length <= 180 && !isGenericEducationValidation(line));

  const institutionLine = lines.find((line) => {
    const normalized = normalizeAscii(line);
    return (
      normalized.includes('dai hoc') ||
      normalized.includes('truong') ||
      normalized.includes('hoc vien') ||
      normalized.includes('cao dang') ||
      normalized.includes('university') ||
      normalized.includes('college') ||
      normalized.includes('academy') ||
      normalized.includes('institute') ||
      normalized.includes('hutech') ||
      normalized.includes('fpt') ||
      normalized.includes('bach khoa')
    );
  }) || '';

  const source = institutionLine || lines[0] || '';
  if (!source) {
    return null;
  }

  const majorMatch = text.match(/(?:chuyÃƒÂªn ngÃƒÂ nh|chuyen nganh|ngÃƒÂ nh|nganh|major|faculty)\s*[:Ã¯Â¼Å¡-]\s*([^.;\n]+)/i);
  const degreeMatch = text.match(/\b(cÃ¡Â»Â­ nhÃƒÂ¢n|cu nhan|kÃ¡Â»Â¹ sÃ†Â°|ky su|thÃ¡ÂºÂ¡c sÃ„Â©|thac si|tiÃ¡ÂºÂ¿n sÃ„Â©|tien si|bachelor|master|engineer|bsc|msc)\b/i);
  const dashParts = source.split(/\s[-Ã¢â‚¬â€œÃ¢â‚¬â€|]\s/).map((part) => cleanTimelineText(part)).filter(Boolean);

  return {
    institution: getEducationInstitutionFromLine(source),
    major: cleanTimelineText(majorMatch?.[1] || (dashParts.length > 1 ? dashParts.slice(1).join(' - ') : '')),
    degree: cleanTimelineText(degreeMatch?.[1] || ''),
    rawLine: source,
  };
}

function buildEducationSummary(
  candidate: Candidate,
  educationDetail?: DetailedScore,
  cvText?: string
): EducationSummary | null {
  const validation = candidate.analysis?.educationValidation;
  const sources: string[] = [
    validation?.standardizedEducation || '',
    ...(validation?.warnings || []),
    educationDetail ? getDetailEvidence(educationDetail) : '',
    educationDetail ? getDetailExplanation(educationDetail) : '',
    candidate._cvText || '',
    cvText || '',
  ].filter(Boolean);

  if (candidate._rawBatchJson) {
    try {
      sources.push(...collectStringLeaves(JSON.parse(candidate._rawBatchJson)));
    } catch {
      // Ignore malformed raw payloads.
    }
  }

  for (const source of sources) {
    if (!source || looksLikeAnalysisPayload(source)) continue;
    const summary = extractEducationSummaryFromText(source);
    if (summary?.institution && !isGenericEducationValidation(summary.institution)) {
      return summary;
    }
  }

  return null;
}

function formatScoreValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function parseNumericValue(value: string): number | null {
  const match = value.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDetailScore(
  scoreText: string,
  detailFormula: string,
): {
  score: number | null;
  maxScore: number | null;
  rawScore: number | null;
  rawMax: number | null;
  weight: number;
  achievedPct: number;
  contributionPct: number;
  hasScore: boolean;
  scoreLabel: string;
} {
  const trimmedScore = scoreText.trim();
  const ratioMatch = trimmedScore.match(/([+-]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);

  let rawScore: number | null = null;
  let rawMax: number | null = null;

  if (ratioMatch) {
    rawScore = Number.parseFloat(ratioMatch[1]);
    rawMax = Number.parseFloat(ratioMatch[2]);
  } else {
    rawScore = parseNumericValue(trimmedScore);
  }

  const hasScore = rawScore !== null;
  const displayScore = rawScore;
  const displayMax = rawMax;

  const achievedPct = rawScore !== null && rawMax && rawMax > 0
    ? Math.round((rawScore / rawMax) * 100)
    : displayScore !== null && displayMax && displayMax > 0
      ? Math.round((displayScore / displayMax) * 100)
      : 0;

  const weightMatch = detailFormula.match(/trong so\s*([\d.]+)%/i);
  const weight = Number.parseFloat(weightMatch?.[1] || '0');

  let scoreLabel = 'ChÃ†Â°a cÃƒÂ³';
  if (displayScore !== null && displayMax !== null) {
    scoreLabel = `${formatScoreValue(displayScore)}/${formatScoreValue(displayMax)}`;
  } else if (displayScore !== null && trimmedScore) {
    scoreLabel = trimmedScore;
  }

  return {
    score: displayScore,
    maxScore: displayMax,
    rawScore,
    rawMax,
    weight: Number.isFinite(weight) ? weight : 0,
    achievedPct,
    contributionPct: achievedPct,
    hasScore,
    scoreLabel,
  };
}

type ParsedDetailScore = ReturnType<typeof parseDetailScore>;

function normalizeParsedScoreToMax(parsed: ParsedDetailScore, targetMax: number): ParsedDetailScore {
  if (!parsed.hasScore || parsed.score === null) {
    return parsed;
  }

  const sourceMax = parsed.maxScore && parsed.maxScore > 0 ? parsed.maxScore : targetMax;
  const normalizedScore = Math.min(targetMax, Math.max(0, (parsed.score / sourceMax) * targetMax));
  const achievedPct = Math.round((normalizedScore / targetMax) * 100);

  return {
    ...parsed,
    score: normalizedScore,
    maxScore: targetMax,
    achievedPct,
    contributionPct: achievedPct,
    scoreLabel: `${formatScoreValue(normalizedScore)}/${formatScoreValue(targetMax)}`,
  };
}

function canonicalizeCriterionName(rawName: string): string {
  const value = rawName.trim();
  const normalized = normalizeAscii(value);

  if (normalized === 'phu hop jd' || normalized === 'phu hop jd job fit' || normalized === 'job fit') return BASIC_CRITERIA[0];
  if (normalized === 'kinh nghiem') return BASIC_CRITERIA[1];
  if (normalized === 'ky nang') return BASIC_CRITERIA[2];
  if (normalized === 'thanh tuu kpi' || normalized === 'thanh tuu') return BASIC_CRITERIA[3];
  if (normalized === 'hoc van') return BASIC_CRITERIA[4];
  if (normalized === 'ngon ngu') return BASIC_CRITERIA[5];
  if (normalized === 'chuyen nghiep') return BASIC_CRITERIA[6];
  if (normalized.includes('gan bo') || normalized.includes('lich su cv')) return BASIC_CRITERIA[7];
  if (normalized === 'phu hop van hoa' || normalized === 'culture fit') return BASIC_CRITERIA[8];
  if (normalized.includes('uy tin cong ty') || normalized.includes('company tier')) return BASIC_CRITERIA[9];
  if (normalized.includes('muc do trung thanh') || normalized.includes('su on dinh') || normalized.includes('trung thanh')) return REMOVED_CRITERIA[0];
  if (normalized.includes('ky nang hanh dong') || normalized.includes('chu dong')) return REMOVED_CRITERIA[1];
  if (normalized.includes('trinh bay star') || normalized.includes('star ket qua')) return REMOVED_CRITERIA[2];
  if (normalized.includes('skill graph') || normalized.includes('ky nang chuyen doi')) return REMOVED_CRITERIA[3];
  if (normalized.includes('career velocity') || normalized.includes('tiem nang phat trien')) return REMOVED_CRITERIA[4];

  return value;
}

interface CriterionAccordionProps {
  item: DetailedScore;
  isExpanded: boolean;
  onToggle: () => void;
  jdText: string;
}

const CriterionAccordion: React.FC<CriterionAccordionProps> = ({ item, isExpanded, onToggle, jdText }) => {
  const [copied, setCopied] = React.useState(false);
  const criterionName = canonicalizeCriterionName(getDetailCriterion(item));
  const detailScore = getDetailScore(item);
  const detailFormula = getDetailFormula(item);
  const detailEvidence = getDetailEvidence(item);
  const detailExplanation = getDetailExplanation(item);
  const shouldShowRawEvidence = Boolean(
    detailEvidence &&
    detailEvidence !== MISSING_DETAIL_EVIDENCE &&
    normalizeAscii(detailEvidence) !== 'khong tim thay thong tin trong cv' &&
    !looksLikeAnalysisPayload(detailEvidence)
  );
  const copyEvidenceText = detailEvidence;
  const canShowRawEvidence = shouldShowRawEvidence;

  const parsedData = useMemo(() => {
    return parseDetailScore(detailScore, detailFormula);
  }, [detailFormula, detailScore]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyEvidenceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = CARD_CRITERIA_META[criterionName] || { Icon: CircleHelp, color: 'text-slate-400', accent: 'border-slate-700 bg-slate-900/20' };
  const MetaIcon = meta.Icon;
  const description = CRITERION_DESCRIPTIONS[criterionName];
  const hasRealEvidence = canShowRawEvidence;

  const scorePercentage = parsedData.achievedPct;
  const scoreBadgeClass = !parsedData.hasScore
    ? 'bg-slate-800/60 text-slate-400 border-slate-700/80'
    : scorePercentage >= 85
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
      : scorePercentage >= 65
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
        : 'bg-red-500/15 text-red-300 border-red-500/35';

  const proficiency = !parsedData.hasScore ? 'ChÃ†Â°a cÃƒÂ³'
    : scorePercentage >= 90 ? 'XuÃ¡ÂºÂ¥t sÃ¡ÂºÂ¯c'
      : scorePercentage >= 75 ? 'NÃƒÂ¢ng cao'
        : scorePercentage >= 55 ? 'Trung bÃƒÂ¬nh'
          : 'CÃ†Â¡ bÃ¡ÂºÂ£n';

  const isExperience = criterionName === BASIC_CRITERIA[1];
  const jdRequirements = useMemo(() => extractJDRequirements(jdText), [jdText]);
  const thisRequirement = useMemo(() => jdRequirements.find(r => r.display === criterionName), [criterionName, jdRequirements]);
  const requirementComparison = useMemo(() => {
    if (isExperience || !thisRequirement || !hasRealEvidence) return null;
    return compareEvidence(criterionName, thisRequirement.keywords, detailEvidence);
  }, [criterionName, detailEvidence, hasRealEvidence, isExperience, thisRequirement]);

  let experienceBlock: React.ReactNode = null;
  let matchMeta: ReturnType<typeof analyzeExperience> | null = null;
  if (isExperience && hasRealEvidence) {
    matchMeta = analyzeExperience(jdText, detailEvidence || '');
    experienceBlock = (
      <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
        <h5 className="mb-1 text-base font-bold text-slate-100">PhÃƒÂ¢n tÃƒÂ­ch nhanh</h5>
        {matchMeta.matchPercent === 'N/A' ? (
          <p className="text-xs text-slate-500 italic">JD chÃ†Â°a cÃƒÂ³ mÃ¡Â»Â©c yÃƒÂªu cÃ¡ÂºÂ§u kinh nghiÃ¡Â»â€¡m rÃƒÂµ rÃƒÂ ng</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>MÃ¡Â»Â©c Ã„â€˜Ã¡Â»â„¢ phÃƒÂ¹ hÃ¡Â»Â£p JD</span>
                <span className="font-semibold text-cyan-400">{matchMeta.matchPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full ${typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 80 ? 'bg-emerald-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 65 ? 'bg-yellow-500' : typeof matchMeta.matchPercent === 'number' && matchMeta.matchPercent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${typeof matchMeta.matchPercent === 'number' ? Math.min(100, Math.max(0, matchMeta.matchPercent)) : 0}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {matchMeta.matched.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 text-[10px] border border-emerald-500/40">{k}</span>)}
              {matchMeta.missing.slice(0, 5).map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-300 text-[10px] border border-yellow-500/40">{k}</span>)}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#05070b] transition-all duration-200 hover:border-cyan-500/25 hover:shadow-md hover:shadow-cyan-500/5">
      <button className="flex min-h-[56px] w-full items-center justify-between p-3.5 text-left" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] ${meta.color}`}>
            <MetaIcon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="truncate font-semibold text-slate-100">{criterionName}</span>
          <span className="ml-1 rounded border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">{proficiency}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${scoreBadgeClass}`}>
            {parsedData.scoreLabel}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/60 px-4 pb-4 pt-3">
          <div className={`grid grid-cols-1 ${isExperience || requirementComparison ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4`}>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-base font-bold text-slate-200">DÃ¡ÂºÂ«n chÃ¡Â»Â©ng (trÃƒÂ­ch tÃ¡Â»Â« CV)</h5>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-400">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Ã„ÂÃƒÂ£ chÃƒÂ©p' : 'ChÃƒÂ©p'}
                </button>
              </div>
              {canShowRawEvidence ? (
                <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                  __html: detailEvidence
                }} />
              ) : (
                <blockquote className="border-l-4 border-cyan-500/60 pl-4 text-base italic leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                  __html: '<span class="not-italic rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">ChÃ†Â°a tÃƒÂ¬m thÃ¡ÂºÂ¥y trong CV</span>'
                }} />
              )}
            </div>

            {isExperience && experienceBlock}
            {!isExperience && requirementComparison && (
              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-[#080f1e] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="mb-1 text-base font-bold text-slate-100">PhÃƒÂ¢n tÃƒÂ­ch nhanh</h5>
                    <p className="text-[11px] text-slate-500">KhÃ¡Â»â€ºp trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p vÃƒÂ  vector ngÃ¡Â»Â¯ nghÃ„Â©a, chÃ¡Â»â€° giÃ¡Â»Â¯ tÃƒÂ­n hiÃ¡Â»â€¡u quan trÃ¡Â»Âng.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200">
                    {requirementComparison.matched.length + requirementComparison.semanticMatched.length}/{requirementComparison.jdKeywords.length}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-400">Ã„ÂÃƒÂ£ khÃ¡Â»â€ºp</div>
                    <div className="flex flex-wrap gap-1">
                      {requirementComparison.matched.length > 0
                        ? requirementComparison.matched.slice(0, 6).map(k => <span key={k} className="pill pill--match">{k}</span>)
                        : requirementComparison.semanticMatched.length === 0
                          ? <span className="text-[11px] text-slate-500">(KhÃƒÂ´ng)</span>
                          : null}
                      {requirementComparison.semanticMatched.slice(0, 4).map((item) => (
                        <span key={item.keyword} className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                          {item.keyword} Ã‚Â· {Math.round(item.score * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-400">CÃƒÂ²n thiÃ¡ÂºÂ¿u</div>
                    <div className="flex flex-wrap gap-1">
                      {requirementComparison.missing.length > 0
                        ? requirementComparison.missing.slice(0, 5).map(k => <span key={k} className="pill pill--missing">{k}</span>)
                        : <span className="text-[11px] text-slate-500">(KhÃƒÂ´ng)</span>}
                    </div>
                  </div>
                </div>

                {requirementComparison.semanticMatched.length > 0 && (
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                      <Target className="h-3 w-3" />
                      Vector embedding
                    </div>
                    <div className="space-y-1.5">
                      {requirementComparison.semanticMatched.slice(0, 2).map((item) => (
                        <p key={`${item.keyword}-reason`} className="text-[11px] leading-5 text-slate-300">
                          <span className="font-semibold text-cyan-200">{item.keyword}:</span> {item.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h5 className="mb-4 text-base font-bold text-slate-100">GiÃ¡ÂºÂ£i thÃƒÂ­ch & CÃƒÂ´ng thÃ¡Â»Â©c</h5>

              {description ? (
                <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">Ã„ÂÃƒÂ¢y lÃƒÂ  gÃƒÂ¬?</p>
                    <p className="text-sm leading-relaxed text-slate-300">{description.what}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">TÃ¡ÂºÂ¡i sao quan trÃ¡Â»Âng?</p>
                    <p className="text-sm leading-relaxed text-slate-400">{description.why}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">DÃ¡ÂºÂ¥u hiÃ¡Â»â€¡u nhÃ¡ÂºÂ­n biÃ¡ÂºÂ¿t</p>
                    <ul className="space-y-1.5">
                      {description.signals.map((signal, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-slate-400">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {detailExplanation && detailExplanation !== '...' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">NhÃ¡ÂºÂ­n xÃƒÂ©t cÃ¡Â»Â§a AI vÃ¡Â»â€ºi CV nÃƒÂ y</p>
                      <p className="text-xs leading-relaxed text-slate-300 italic">"{detailExplanation}"</p>
                    </div>
                  )}
                </div>
              ) : (
                detailExplanation && (
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed text-slate-300">{detailExplanation}</p>
                  </div>
                )
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">CÃƒÂ´ng thÃ¡Â»Â©c tÃƒÂ­nh Ã„â€˜iÃ¡Â»Æ’m</div>

                {parsedData.hasScore ? (
                  <>
                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Ã„ÂÃƒÂ¡nh giÃƒÂ¡ thÃ¡Â»Â±c tÃ¡ÂºÂ¿</span>
                        <span className="font-mono font-semibold text-cyan-400">{parsedData.scoreLabel}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">CÃƒÂ´ng thÃ¡Â»Â©c subscore</div>
                      <div className="font-mono text-xs">
                        {parsedData.maxScore !== null ? (
                          <span>
                            <span className="text-sky-400">{formatScoreValue(parsedData.score || 0)}</span>
                            {' / '}
                            <span className="text-violet-400">{formatScoreValue(parsedData.maxScore)}</span>
                            {' = '}
                            <span className="font-bold text-amber-400">{parsedData.contributionPct}%</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trÃ¡Â»Âng sÃ¡Â»â€˜)</span>
                            )}
                          </span>
                        ) : (
                          <span>
                            <span className="text-sky-400">{parsedData.scoreLabel}</span>
                            {parsedData.weight > 0 && (
                              <span className="text-slate-500"> ({parsedData.weight}% trÃ¡Â»Âng sÃ¡Â»â€˜)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-2.5">
                      <div className="mb-1 text-xs text-slate-500">Ã„ÂÃƒÂ³ng gÃƒÂ³p vÃƒÂ o Ã„â€˜iÃ¡Â»Æ’m tÃ¡Â»â€¢ng</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${parsedData.achievedPct >= 80 ? 'bg-emerald-500' : parsedData.achievedPct >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, parsedData.achievedPct)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold tabular-nums ${parsedData.achievedPct >= 80 ? 'text-emerald-400' : parsedData.achievedPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{parsedData.achievedPct}%</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          TiÃƒÂªu chÃƒÂ­ nÃƒÂ y Ã„â€˜ÃƒÂ³ng gÃƒÂ³p{' '}
                          <span className="font-bold text-amber-400 font-mono">{parsedData.score !== null ? formatScoreValue(parsedData.score) : '0'}</span>
                          {parsedData.maxScore !== null && (
                            <>
                              {' / '}
                              <span className="text-slate-400 font-mono">{formatScoreValue(parsedData.maxScore)}</span> Ã„â€˜iÃ¡Â»Æ’m
                            </>
                          )}
                          {parsedData.maxScore === null && ' Ã„â€˜iÃ¡Â»Æ’m'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-xs text-slate-400">
                    ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u Ã„â€˜iÃ¡Â»Æ’m chi tiÃ¡ÂºÂ¿t cho tiÃƒÂªu chÃƒÂ­ nÃƒÂ y trong kÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ AI hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpandedContentProps {
  candidate: Candidate;
  expandedCriteria: Record<string, Record<string, boolean>>;
  onToggleCriterion: (candidateId: string, criterion: string) => void;
  jdText: string;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ candidate, expandedCriteria, onToggleCriterion, jdText }) => {
  const analysisRecord = candidate.analysis as Record<string, unknown> | undefined;
  const allDetails = useMemo(() => {
    const rawDetails = analysisRecord ? getRawRecordValueByAliases(analysisRecord, ['chi tiet']) : undefined;

    return Array.isArray(rawDetails) ? rawDetails as DetailedScore[] : [];
  }, [analysisRecord]);

  const { basicDetails, supplementalDetails } = useMemo(() => {
    const basicMap = new Map<string, DetailedScore>();
    const supplementalMap = new Map<string, DetailedScore>();

    allDetails.forEach((item) => {
      const canonical = canonicalizeCriterionName(getDetailCriterion(item));
      if (!canonical) {
        return;
      }

      if (REMOVED_CRITERIA.includes(canonical)) {
        return;
      }

      if (BASIC_CRITERIA.includes(canonical)) {
        if (!basicMap.has(canonical)) {
          basicMap.set(canonical, item);
        }
        return;
      }

      if (!supplementalMap.has(canonical)) {
        supplementalMap.set(canonical, item);
      }
    });

    return {
      basicDetails: BASIC_CRITERIA
        .map((criterionName) => basicMap.get(criterionName))
        .filter((item): item is DetailedScore => Boolean(item)),
      supplementalDetails: Array.from(supplementalMap.values()),
    };
  }, [allDetails]);

  const basicScore = useMemo(() =>
    basicDetails.reduce((sum, item) => {
      const parsed = parseDetailScore(getDetailScore(item), getDetailFormula(item));
      return sum + (parsed.score || 0);
    }, 0),
    [basicDetails]
  );

  const totalScore = useMemo(() => {
    const rawTotal = analysisRecord ? getRawRecordValueByAliases(analysisRecord, ['tong diem']) : undefined;

    if (typeof rawTotal === 'number' && Number.isFinite(rawTotal)) {
      return Math.min(100, Math.max(0, rawTotal));
    }

    if (typeof rawTotal === 'string') {
      const parsed = parseNumericValue(rawTotal);
      if (parsed !== null) {
        return Math.min(100, Math.max(0, parsed));
      }
    }

    return Math.min(100, parseFloat(basicScore.toFixed(1)));
  }, [analysisRecord, basicScore]);

  const educationDetail = useMemo(
    () => basicDetails.find((item) => canonicalizeCriterionName(getDetailCriterion(item)) === BASIC_CRITERIA[4]),
    [basicDetails]
  );
  const [educationSummary, setEducationSummary] = useState<EducationSummary | null>(() => buildEducationSummary(candidate, educationDetail));

  useEffect(() => {
    let isDisposed = false;

    const hydrateEducation = async () => {
      try {
        const cvText = await resolveCandidateCvText(candidate);
        const nextSummary = buildEducationSummary(candidate, educationDetail, cvText);
        if (!isDisposed) {
          setEducationSummary(nextSummary);
        }
      } catch {
        if (!isDisposed) {
          setEducationSummary(buildEducationSummary(candidate, educationDetail));
        }
      }
    };

    void hydrateEducation();

    return () => {
      isDisposed = true;
    };
  }, [candidate, educationDetail]);

  const matchPercent = Math.min(100, Math.round(totalScore));
  const recommendation = totalScore >= 75
    ? 'Ã¡Â»Â¨ng viÃƒÂªn xuÃ¡ÂºÂ¥t sÃ¡ÂºÂ¯c, nÃƒÂªn Ã†Â°u tiÃƒÂªn mÃ¡Â»Âi phÃ¡Â»Âng vÃ¡ÂºÂ¥n sÃ¡Â»â€ºm.'
    : totalScore >= 60
      ? 'Ã¡Â»Â¨ng viÃƒÂªn cÃƒÂ³ nÃ¡Â»Ân tÃ¡ÂºÂ£ng tÃ¡Â»â€˜t, nÃƒÂªn xem xÃƒÂ©t mÃ¡Â»Âi phÃ¡Â»Âng vÃ¡ÂºÂ¥n.'
      : totalScore >= 40
        ? 'Ã¡Â»Â¨ng viÃƒÂªn cÃƒÂ³ tiÃ¡Â»Âm nÃ„Æ’ng, cÃƒÂ¢n nhÃ¡ÂºÂ¯c nÃ¡ÂºÂ¿u thiÃ¡ÂºÂ¿u nguÃ¡Â»â€œn.'
        : 'NÃƒÂªn Ã†Â°u tiÃƒÂªn Ã¡Â»Â©ng viÃƒÂªn khÃƒÂ¡c cÃƒÂ³ mÃ¡Â»Â©c phÃƒÂ¹ hÃ¡Â»Â£p cao hÃ†Â¡n.';
  const educationValidation = candidate.analysis?.educationValidation;
  const educationValidationNote = educationValidation?.validationNote || 'ChÃ†Â°a xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh';
  const educationIsValid = normalizeAscii(educationValidationNote).includes('hop le') || normalizeAscii(educationValidationNote).includes('valid');
  const standardizedEducation = educationValidation?.standardizedEducation || '';
  const shouldShowStandardizedEducation = Boolean(standardizedEducation && !isGenericEducationValidation(standardizedEducation));

  return (
    <div className="space-y-4 p-2 md:p-4">

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ TÃ¡Â»â€¢ng hÃ¡Â»Â£p Ã„â€˜ÃƒÂ¡nh giÃƒÂ¡ Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <i className="fa-solid fa-chart-pie text-cyan-400" />
            TÃ¡Â»â€¢ng hÃ¡Â»Â£p Ã„â€˜ÃƒÂ¡nh giÃƒÂ¡
          </h4>
          <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-3">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">TÃ¡Â»â€¢ng Ã„â€˜iÃ¡Â»Æ’m</div>
              <div className="font-semibold text-slate-100">{totalScore.toFixed(1)}<span className="text-slate-500">/100</span></div>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.045] px-3 py-2 text-xs">
              <div className="text-cyan-500/70">CÃ¡Â»â€˜t lÃƒÂµi</div>
              <div className="font-semibold text-cyan-300">{basicScore.toFixed(1)}<span className="text-slate-500">/{BASIC_TOTAL_MAX}</span></div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs">
              <div className="text-slate-500">PhÃƒÂ¹ hÃ¡Â»Â£p JD</div>
              <div className="font-semibold text-emerald-400">{matchPercent}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-20 text-cyan-500/80">CÃ¡Â»â€˜t lÃƒÂµi</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (basicScore / BASIC_TOTAL_MAX) * 100)}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-cyan-400">{Math.round((basicScore / BASIC_TOTAL_MAX) * 100)}%</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm">
          <span className="font-semibold text-slate-200">NhÃ¡ÂºÂ­n Ã„â€˜Ã¡Â»â€¹nh:</span>{' '}
          <span className="text-slate-400">{recommendation}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidate.analysis?.['Ã„ÂiÃ¡Â»Æ’m mÃ¡ÂºÂ¡nh CV'] && (
          <div className="p-4 bg-[#05070b] border border-emerald-500/20 rounded-xl">
            <p className="font-semibold text-green-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Ã„ÂiÃ¡Â»Æ’m mÃ¡ÂºÂ¡nh CV
            </p>
            <ul className="list-disc list-inside text-sm text-green-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Ã„ÂiÃ¡Â»Æ’m mÃ¡ÂºÂ¡nh CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
        {candidate.analysis?.['Ã„ÂiÃ¡Â»Æ’m yÃ¡ÂºÂ¿u CV'] && (
          <div className="p-4 bg-[#05070b] border border-rose-500/20 rounded-xl">
            <p className="font-semibold text-red-300 mb-2 flex items-center gap-2 text-base">
              <i className="fa-solid fa-flag"></i>Ã„ÂiÃ¡Â»Æ’m yÃ¡ÂºÂ¿u CV
            </p>
            <ul className="list-disc list-inside text-sm text-red-300/90 space-y-1.5 pl-2 leading-relaxed">
              {candidate.analysis['Ã„ÂiÃ¡Â»Æ’m yÃ¡ÂºÂ¿u CV'].map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CÃ¡ÂºÂ£nh bÃƒÂ¡o AI Debiasing Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {candidate.debiasingWarnings && candidate.debiasingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-[#05070b] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-300">
            <i className="fa-solid fa-scale-balanced"></i> CÃ¡ÂºÂ£nh bÃƒÂ¡o Ã„ÂÃ¡ÂºÂ¡o Ã„â€˜Ã¡Â»Â©c AI
          </h4>
          <ul className="space-y-2">
            {candidate.debiasingWarnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-white/[0.025] p-2.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
                <span className="text-sm text-amber-200/80 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Education Validation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {educationValidation && (
        <div className="rounded-xl border border-white/[0.08] bg-[#05070b] p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-100">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> XÃƒÂ¡c thÃ¡Â»Â±c hÃ¡Â»Âc vÃ¡ÂºÂ¥n
          </h4>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300/80">CÃ†Â¡ sÃ¡Â»Å¸ Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {educationSummary?.institution || 'ChÃ†Â°a tÃƒÂ¬m thÃ¡ÂºÂ¥y tÃƒÂªn cÃ†Â¡ sÃ¡Â»Å¸ Ã„â€˜ÃƒÂ o tÃ¡ÂºÂ¡o trong CV'}
                  </p>
                </div>

                {(educationSummary?.major || educationSummary?.degree || shouldShowStandardizedEducation) && (
                  <div className="grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                    {educationSummary?.major && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">NgÃƒÂ nh hÃ¡Â»Âc</span>
                        <span className="mt-1 block text-slate-200">{educationSummary.major}</span>
                      </div>
                    )}
                    {educationSummary?.degree && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">BÃ¡ÂºÂ±ng cÃ¡ÂºÂ¥p</span>
                        <span className="mt-1 block text-slate-200">{educationSummary.degree}</span>
                      </div>
                    )}
                    {shouldShowStandardizedEducation && (
                      <div className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">ChuÃ¡ÂºÂ©n hÃƒÂ³a</span>
                        <span className="mt-1 block text-slate-200">{standardizedEducation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${educationIsValid ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-red-500/35 bg-red-500/10 text-red-300'}`}>
                {educationValidationNote}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tab chuyÃ¡Â»Æ’n Ã„â€˜Ã¡Â»â€¢i CÃ†Â¡ bÃ¡ÂºÂ£n / NÃƒÂ¢ng cao Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="rounded-xl border border-white/[0.08] bg-[#030405] overflow-hidden">
        <div className="border-b border-white/[0.08] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-cyan-300">
            <i className="fa-solid fa-layer-group text-base"></i>
            <span>TiÃƒÂªu chÃƒÂ­ cÃ¡Â»â€˜t lÃƒÂµi</span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{BASIC_TOTAL_MAX} Ã„â€˜iÃ¡Â»Æ’m</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${basicScore / BASIC_TOTAL_MAX >= 0.8 ? 'text-emerald-400' : basicScore / BASIC_TOTAL_MAX >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{basicScore.toFixed(1)}/{BASIC_TOTAL_MAX}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <i className="fa-solid fa-circle-info text-cyan-500/60 text-xs"></i>
            <p className="text-[11px] text-slate-500">
              {basicDetails.length} tiÃƒÂªu chÃƒÂ­ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ Ã¢â‚¬Â¢ {BASIC_CRITERIA.length} tiÃƒÂªu chÃƒÂ­ cÃ¡Â»â€˜t lÃƒÂµi Ã¢â‚¬Â¢ TÃ¡Â»â€¢ng phÃ¡Â»â€¢ Ã„â€˜iÃ¡Â»Æ’m <span className="text-cyan-400 font-bold">{BASIC_TOTAL_MAX}</span> Ã„â€˜iÃ¡Â»Æ’m Ã¢â‚¬Â¢ Ã„ÂÃƒÂ¡nh giÃƒÂ¡ nÃ¡Â»Ân tÃ¡ÂºÂ£ng Ã¡Â»Â©ng viÃƒÂªn
            </p>
          </div>

          {basicDetails.length > 0 ? (
            basicDetails.map((item) => {
              const criterionName = canonicalizeCriterionName(getDetailCriterion(item));
              return (
                <CriterionAccordion
                  key={criterionName}
                  item={item}
                  isExpanded={!!expandedCriteria[candidate.id]?.[criterionName]}
                  onToggle={() => onToggleCriterion(candidate.id, criterionName)}
                  jdText={jdText}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <i className="fa-solid fa-layer-group text-3xl mb-3 opacity-30"></i>
              <p className="text-sm">ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u tiÃƒÂªu chÃƒÂ­ cÃ¡Â»â€˜t lÃƒÂµi</p>
            </div>
          )}

          {supplementalDetails.length > 0 && (
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-emerald-400/70 text-xs"></i>
                <p className="text-[11px] text-slate-500">Cac phan tich bo sung do backend tra ve</p>
              </div>
              {supplementalDetails.map((item, index) => {
                const criterionName = canonicalizeCriterionName(getDetailCriterion(item)) || `supplemental-${index}`;
                return (
                  <CriterionAccordion
                    key={`${criterionName}-${index}`}
                    item={item}
                    isExpanded={!!expandedCriteria[candidate.id]?.[criterionName]}
                    onToggle={() => onToggleCriterion(candidate.id, criterionName)}
                    jdText={jdText}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandedContent;
