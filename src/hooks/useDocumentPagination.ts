import { useMemo } from 'react';

export type PaperSize = 'A4' | 'A3' | 'B5';

export interface SectionHeights {
  HEADER_FIRST: number;
  HEADER_NEXT: number;
  TABLE_HEADER: number;
  ROW: number;
  SUMMARY_ROW: number;
  REMARKS_BASE: number;
  REMARKS_LINE: number;
  BUTTON: number;
  FOOTER: number;
}

export interface PaginationConfig {
  paperSize: PaperSize;
  margins: number;
  sectionHeights: SectionHeights;
}

export interface PageItem<T> {
  type: 'item' | 'subtotal' | 'vat' | 'total';
  data?: T;
}

export interface Page<T> {
  items: PageItem<T>[];
  isFirst: boolean;
  isLast: boolean;
  showButton: boolean;  // 버튼을 표시할 페이지 (아이템이 있는 마지막 페이지)
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

// Improved version that takes pre-constructed rows
export function usePageSplitter<T>(
  allRows: PageItem<T>[],
  remarks: string,
  config: PaginationConfig
) {
  const { paperSize, margins, sectionHeights } = config;

  const pages = useMemo(() => {
    let totalPageHeight = 297;
    if (paperSize === 'A3') totalPageHeight = 420;
    if (paperSize === 'B5') totalPageHeight = 250;

    // Margin safety buffer (50mm total for top/bottom margins)
    const contentHeight = totalPageHeight - 50; 

    const resultPages: Page<T>[] = [];
    let currentPageItems: PageItem<T>[] = [];
    let currentHeight = sectionHeights.HEADER_FIRST + sectionHeights.TABLE_HEADER;

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      
      // 1. Calculate Row Height
      let rowHeight = sectionHeights.ROW;
      if (row.type !== 'item') {
        rowHeight = sectionHeights.SUMMARY_ROW;
      }

      // 2. Check Page Overflow
      if (currentHeight + rowHeight > contentHeight) {
        resultPages.push({
          items: currentPageItems,
          isFirst: resultPages.length === 0,
          isLast: false,
          showButton: false
        });
        currentPageItems = [];
        currentHeight = sectionHeights.HEADER_NEXT + sectionHeights.TABLE_HEADER;
      }

      // 3. Add Row
      currentPageItems.push(row);
      currentHeight += rowHeight;
    }

    // 5. Handle Bottom Section (Remarks + Button + Footer)
    const remarksLines = (remarks.match(/\n/g) || []).length + 1;
    const remarksHeight = Math.max(3, remarksLines);
    const remarksTotalHeight = sectionHeights.REMARKS_BASE + (remarksHeight * sectionHeights.REMARKS_LINE);
    const bottomSectionHeight = remarksTotalHeight + sectionHeights.BUTTON + sectionHeights.FOOTER;

    // 버튼만 포함한 높이 계산 (비고 제외)
    const buttonOnlyHeight = sectionHeights.BUTTON;
    
    if (currentHeight + bottomSectionHeight > contentHeight) {
      // 비고가 안 들어감 → 버튼은 현재 페이지에, 비고는 다음 페이지로
      if (currentHeight + buttonOnlyHeight <= contentHeight) {
        // 버튼은 들어감 → 현재 페이지에 버튼 표시
        resultPages.push({
          items: currentPageItems,
          isFirst: resultPages.length === 0,
          isLast: false,
          showButton: true  // 버튼 표시
        });
        // 비고만 있는 새 페이지
        resultPages.push({
          items: [],
          isFirst: false,
          isLast: true,
          showButton: false
        });
      } else {
        // 버튼도 안 들어감 → 둘 다 다음 페이지로
        resultPages.push({
          items: currentPageItems,
          isFirst: resultPages.length === 0,
          isLast: false,
          showButton: false
        });
        resultPages.push({
          items: [],
          isFirst: false,
          isLast: true,
          showButton: true  // 비고 페이지에 버튼도 표시
        });
      }
    } else {
      // 모두 들어감 → 현재 페이지가 마지막
      resultPages.push({
        items: currentPageItems,
        isFirst: resultPages.length === 0,
        isLast: true,
        showButton: true
      });
    }

    return resultPages;
  }, [allRows, remarks, paperSize, margins, sectionHeights]);

  return pages;
}
