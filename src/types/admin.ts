export interface Complaint {
  id: string;
  item_name: string;
  class_name: string;
  department: string;
  floor: string;
  description: string;
  photo_url?: string;
  status: string;
  priority?: string;
  user_id: string;
  created_at: string;
}

export interface LostItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  owner_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface FoundItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  finder_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface Resource {
  id: string;
  uploader_name: string;
  course_name: string;
  subject_name: string;
  file_url: string;
  file_name: string;
  tips?: string;
  user_id: string;
  created_at: string;
}

export type AdminTabType = 'overview' | 'complaints' | 'resolved' | 'lost' | 'found' | 'resources';