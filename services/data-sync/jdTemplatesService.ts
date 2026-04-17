import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface UserJDTemplate {
  id: string;
  uid: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: any;
  createdAt: any;
  updatedAt: any;
}

export type CreateJDTemplateInput = Omit<UserJDTemplate, 'id' | 'uid' | 'createdAt' | 'updatedAt'>;

const JD_TEMPLATES_COLLECTION = 'userJDTemplates';

export class JDTemplatesService {

  /** Lấy toàn bộ mẫu JD của user hiện tại */
  static async getUserTemplates(): Promise<UserJDTemplate[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, JD_TEMPLATES_COLLECTION),
        where('uid', '==', user.uid)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserJDTemplate));
      
      // Sort in memory by updatedAt descending
      results.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

      // Lọc bỏ các mẫu trùng tên (giữ lại mẫu cập nhật gần nhất) và xóa trên database
      const uniqueResults: UserJDTemplate[] = [];
      const seenNames = new Set<string>();
      const duplicatesToDelete: string[] = [];

      for (const t of results) {
        if (!seenNames.has(t.name)) {
          seenNames.add(t.name);
          uniqueResults.push(t);
        } else {
          duplicatesToDelete.push(t.id);
        }
      }

      // Xóa các bản phụ trên nền background
      if (duplicatesToDelete.length > 0) {
        Promise.all(duplicatesToDelete.map(id => deleteDoc(doc(db, JD_TEMPLATES_COLLECTION, id))))
          .catch(err => console.error('Error auto-cleaning duplicate templates:', err));
      }

      return uniqueResults;
    } catch (error) {
      console.error('JDTemplatesService.getUserTemplates error:', error);
      return [];
    }
  }

  /** Tạo mới một mẫu JD cho user hiện tại */
  static async createTemplate(input: CreateJDTemplateInput): Promise<UserJDTemplate | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const newDocRef = doc(collection(db, JD_TEMPLATES_COLLECTION));
      const now = serverTimestamp();
      const data: Omit<UserJDTemplate, 'id'> = {
        uid: user.uid,
        name: input.name,
        category: input.category,
        jobPosition: input.jobPosition,
        jdText: input.jdText,
        hardFilters: input.hardFilters,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(newDocRef, data);
      return { id: newDocRef.id, ...data };
    } catch (error) {
      console.error('JDTemplatesService.createTemplate error:', error);
      return null;
    }
  }

  /** Cập nhật mẫu JD (chỉ owner mới được sửa) */
  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateJDTemplateInput>
  ): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, JD_TEMPLATES_COLLECTION, templateId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error('JDTemplatesService.updateTemplate error:', error);
      return false;
    }
  }

  /** Xóa một mẫu JD (chỉ owner mới được xóa) */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, JD_TEMPLATES_COLLECTION, templateId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.uid !== user.uid) return false;

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('JDTemplatesService.deleteTemplate error:', error);
      return false;
    }
  }

  /** Seed mẫu ban đầu nếu user chưa có mẫu nào */
  static async seedDefaultTemplatesIfEmpty(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const existing = await this.getUserTemplates();
      if (existing.length > 0) return; // Đã có → không seed

      const defaults: CreateJDTemplateInput[] = [
        {
          name: 'Frontend Developer (React)',
          category: 'IT/Software',
          jobPosition: 'Frontend Developer',
          jdText: `- Phát triển các ứng dụng web phức tạp sử dụng React.js, TypeScript.
- Tối ưu hóa hiệu năng ứng dụng, đảm bảo trải nghiệm người dùng mượt mà.
- Phối hợp với team Backend để tích hợp APIs.
- Viết unit test và UI test.
- Tham gia review code và đưa ra các giải pháp kỹ thuật.`,
          hardFilters: {
            location: 'Hà Nội', minExp: '2', seniority: 'Mid-level', education: 'Cử nhân CNTT',
            industry: 'IT', language: 'Tiếng Anh', languageLevel: 'Đọc hiểu tài liệu',
            certificates: '', salaryMin: '15000000', salaryMax: '30000000',
            workFormat: 'Hybrid', contractType: 'Full-time',
            locationMandatory: true, minExpMandatory: true, seniorityMandatory: true,
            educationMandatory: false, industryMandatory: true, languageMandatory: false,
            certificatesMandatory: false, salaryMandatory: false, workFormatMandatory: false,
            contractTypeMandatory: false, contactMandatory: false,
          },
        },
        {
          name: 'Backend Developer (Node.js)',
          category: 'IT/Software',
          jobPosition: 'Backend Developer',
          jdText: `- Xây dựng và duy trì các RESTful APIs và GraphQL endpoints sử dụng Node.js/Express.
- Thiết kế schema cơ sở dữ liệu (PostgreSQL/MongoDB).
- Đảm bảo an ninh, hiệu năng và khả năng mở rộng của hệ thống.
- Tích hợp với các dịch vụ của bên thứ ba (AWS, GCP).
- Tối ưu hóa truy vấn cơ sở dữ liệu.`,
          hardFilters: {
            location: 'Hồ Chí Minh', minExp: '3', seniority: 'Senior', education: 'Cử nhân CNTT',
            industry: 'IT', language: 'Tiếng Anh', languageLevel: 'Giao tiếp khá',
            certificates: 'AWS Cloud Practitioner', salaryMin: '25000000', salaryMax: '45000000',
            workFormat: 'Remote', contractType: 'Full-time',
            locationMandatory: false, minExpMandatory: true, seniorityMandatory: true,
            educationMandatory: false, industryMandatory: true, languageMandatory: true,
            certificatesMandatory: false, salaryMandatory: false, workFormatMandatory: false,
            contractTypeMandatory: false, contactMandatory: false,
          },
        },
        {
          name: 'Marketing Executive',
          category: 'Marketing',
          jobPosition: 'Marketing Executive',
          jdText: `- Lập kế hoạch và triển khai các chiến dịch digital marketing trên các kênh (Facebook, Google, TikTok).
- Quản lý và tối ưu hóa ngân sách quảng cáo.
- Theo dõi, phân tích và báo cáo hiệu quả các chiến dịch (ROI, ROAS).
- Sáng tạo nội dung (content, hình ảnh, video cơ bản) cho các chiến dịch.
- Phối hợp với team thiết kế và sale.`,
          hardFilters: {
            location: 'Hà Nội', minExp: '1', seniority: 'Junior', education: 'Cử nhân Đại học',
            industry: 'Marketing/Advertising', language: 'Tiếng Anh', languageLevel: 'Cơ bản',
            certificates: 'Google Ads Certification', salaryMin: '10000000', salaryMax: '15000000',
            workFormat: 'Office', contractType: 'Full-time',
            locationMandatory: true, minExpMandatory: false, seniorityMandatory: false,
            educationMandatory: true, industryMandatory: true, languageMandatory: false,
            certificatesMandatory: false, salaryMandatory: false, workFormatMandatory: true,
            contractTypeMandatory: true, contactMandatory: false,
          },
        },
      ];

      const batch = writeBatch(db);
      for (const tpl of defaults) {
        const ref = doc(collection(db, JD_TEMPLATES_COLLECTION));
        batch.set(ref, {
          uid: user.uid,
          ...tpl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      console.error('JDTemplatesService.seedDefaultTemplatesIfEmpty error:', error);
    }
  }
}
