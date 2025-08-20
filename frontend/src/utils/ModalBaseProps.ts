import type { RefObject } from "react";
import type { CellMeasurerCache, List, ListRowRenderer } from "react-virtualized";

export type ModalBaseProps = {
  cacheRef: RefObject<CellMeasurerCache>;
  listRef: RefObject<List | null>;
  renderer: ListRowRenderer;
  data: unknown[];
  className?: string
};