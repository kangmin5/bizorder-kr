import { useMemo } from 'react';

export type PaperSize = 'A4' | 'A3' | 'B5';
export type Orientation = 'portrait' | 'landscape';

export interface SectionHeights {
  HEADER_FIRST: number;
  HEADER_NEXT: number;
  TABLE_HEADER: number;
  ROW: number;
  SUMMARY_ROW: number;
  REMARKS_BASE: number;   // 특수조건 기본 높이 (제목 등)
  REMARKS_LINE: number;   // 특수조건 라인당 높이
  BUTTON: number;
  FOOTER: number;
  BANNER_TOP?: number;    // 상단 배너 높이 (선택적)
}

export interface PaginationConfig {
  paperSize: PaperSize;
  orientation: Orientation;
  margins: number;
  sectionHeights: SectionHeights;
  hasBanner?: boolean;    // 상단 배너 유무
}

export interface PageItem<T> {
  type: 'item' | 'subtotal' | 'vat' | 'total';
  data?: T;
}

export interface Page<T> {
  items: PageItem<T>[];
  isFirst: boolean;
  isLast: boolean;
  showButton: boolean;
  remarksLines?: string[];  // 이 페이지에 표시할 특수조건 라인들
}

export function useDocumentPagination<T>(
  items: T[],
  remarks: string,
  config: PaginationConfig
) {
  const { paperSize, margins, sectionHeights } = config;

  const pages = useMemo(() => {
    const resultPages: Page<T>[] = [];
    
    // 1. Prepare all rows (Items + Summary)
    // Note: This assumes standard structure (Items -> Subtotal -> VAT -> Total)
    // If structure varies, we might need to pass 'summaryRows' as argument.
    // For now, we construct it generically inside the component, but here we handle the logic.
    // Actually, the caller should pass the full list of "Rows" to be paginated.
    // But to keep it simple for now, let's let the caller construct the 'allRows' array.
    return resultPages;
  }, [items, remarks, paperSize, margins, sectionHeights]);

  return pages;
}

// 용지 크기별 치수 (mm)
const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  B5: { width: 176, height: 250 },
};

// Improved version that takes pre-constructed rows
export function usePageSplitter<T>(
  allRows: PageItem<T>[],
  remarks: string,
  config: PaginationConfig
) {
  const { paperSize, orientation, margins, sectionHeights, hasBanner } = config;

  const pages = useMemo(() => {
    // 1. 용지 크기와 방향에 따른 실제 페이지 높이 계산
    const paperDim = PAPER_DIMENSIONS[paperSize];
    const pageHeight = orientation === 'landscape' ? paperDim.width : paperDim.height;
    
    // 2. 콘텐츠 영역 높이 (상하 마진 제외)
    const contentHeight = pageHeight - (margins * 2);
    
    // 3. 상단 배너 높이 (있는 경우)
    const bannerHeight = hasBanner && sectionHeights.BANNER_TOP ? sectionHeights.BANNER_TOP : 0;
    
    // 4. 특수조건 라인 분리
    const remarksLineArray = remarks ? remarks.split('\n') : [];
    const totalRemarksLines = remarksLineArray.length;
    
    // 5. 하단 고정 높이 (버튼 + 푸터)
    const fixedBottomHeight = sectionHeights.BUTTON + sectionHeights.FOOTER;

    const resultPages: Page<T>[] = [];
    let currentPageItems: PageItem<T>[] = [];
    
    // 6. 첫 페이지 시작 높이 (헤더 + 배너 + 테이블헤더)
    let currentHeight = sectionHeights.HEADER_FIRST + bannerHeight + sectionHeights.TABLE_HEADER;
    let isFirstPage = true;

    // 7. 품목 행 처리
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      
      // 행 높이 계산
      let rowHeight = sectionHeights.ROW;
      if (row.type !== 'item') {
        rowHeight = sectionHeights.SUMMARY_ROW;
      }

      // 최소 특수조건 높이 (최소 1줄 + 기본 높이)
      const minRemarksHeight = sectionHeights.REMARKS_BASE + sectionHeights.REMARKS_LINE;

      // 페이지 넘침 체크
      if (currentHeight + rowHeight + minRemarksHeight + fixedBottomHeight > contentHeight) {
        // 현재 페이지 저장
        resultPages.push({
          items: currentPageItems,
          isFirst: isFirstPage,
          isLast: false,
          showButton: false,
          remarksLines: []
        });
        
        // 새 페이지 시작
        currentPageItems = [];
        currentHeight = sectionHeights.HEADER_NEXT + sectionHeights.TABLE_HEADER;
        isFirstPage = false;
      }

      // 행 추가
      currentPageItems.push(row);
      currentHeight += rowHeight;
    }

    // 8. 특수조건 처리
    // 현재 페이지에서 특수조건에 사용 가능한 높이
    let availableForRemarks = contentHeight - currentHeight - fixedBottomHeight - sectionHeights.REMARKS_BASE;
    let maxLinesInPage = Math.max(0, Math.floor(availableForRemarks / sectionHeights.REMARKS_LINE));
    
    let remarksIndex = 0;
    
    if (totalRemarksLines <= maxLinesInPage) {
      // 모든 특수조건이 현재 페이지에 들어감
      resultPages.push({
        items: currentPageItems,
        isFirst: isFirstPage,
        isLast: true,
        showButton: true,
        remarksLines: remarksLineArray
      });
    } else {
      // 특수조건이 여러 페이지에 걸쳐 표시됨
      // 현재 페이지에 들어갈 수 있는 만큼 추가
      const firstPageRemarks = remarksLineArray.slice(0, maxLinesInPage);
      remarksIndex = maxLinesInPage;
      
      resultPages.push({
        items: currentPageItems,
        isFirst: isFirstPage,
        isLast: false,
        showButton: true,
        remarksLines: firstPageRemarks
      });
      
      // 나머지 특수조건을 새 페이지들에 분할
      while (remarksIndex < totalRemarksLines) {
        // 새 페이지에서 특수조건에 사용 가능한 높이
        const newPageAvailable = contentHeight - sectionHeights.HEADER_NEXT - fixedBottomHeight - sectionHeights.REMARKS_BASE;
        const linesPerPage = Math.max(1, Math.floor(newPageAvailable / sectionHeights.REMARKS_LINE));
        
        const pageRemarks = remarksLineArray.slice(remarksIndex, remarksIndex + linesPerPage);
        remarksIndex += linesPerPage;
        
        resultPages.push({
          items: [],
          isFirst: false,
          isLast: remarksIndex >= totalRemarksLines,
          showButton: false,
          remarksLines: pageRemarks
        });
      }
    }

    return resultPages;
  }, [allRows, remarks, paperSize, orientation, margins, sectionHeights, hasBanner]);

  return pages;
}
