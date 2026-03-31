export interface Creative {
  id: number;
  日付: string;
  計測URL: string;
  CR名: string;
  計測用URL: string;
  LTV: number;
  COST: number;
  ROAS: number;
  CV: number;
  CPA: number;
  IMP: number;
  Click: number;
  CRサイズ: string;
  CTR: number;
  CVR: number;
  CTVR: number;
  media: string;
  device: string;
  listType: string;
  shortName: string;
  creativePart: string;
  target: string;
}

export type SortKey = keyof Pick<Creative, 'ROAS' | 'COST' | 'CV' | 'CPA' | 'IMP' | 'Click' | 'CTR' | 'CVR' | 'CTVR' | 'LTV'>;
export type SortDir = 'asc' | 'desc';

export interface MediaRow {
  日付: string;
  CR名: string;
  計測リンク: string;
  メディア: string;
  IMP: number;
  Click: number;
  COST: number;
  CV: number;
  CRサイズ: string;
  target: string;
}
