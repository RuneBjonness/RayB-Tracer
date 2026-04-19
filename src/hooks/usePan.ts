import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type Pan = { x: number; y: number };

type DragOrigin = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export type PanHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
};

export const usePan = (): { pan: Pan; handlers: PanHandlers } => {
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });

  const panRef = useRef(pan);
  panRef.current = pan;

  const dragRef = useRef<DragOrigin | null>(null);

  const handlers = useMemo<PanHandlers>(
    () => ({
      onPointerDown(e) {
        // Only start panning on primary button (left-click) or touch/pen.
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Pointer may not be capturable (e.g. synthetic events); drag still
          // works via regular move/up events, just without off-window locking.
        }
        dragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originX: panRef.current.x,
          originY: panRef.current.y,
        };
        document.body.style.cursor = 'grabbing';
      },
      onPointerMove(e) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        setPan({
          x: drag.originX + (e.clientX - drag.startX),
          y: drag.originY + (e.clientY - drag.startY),
        });
      },
      onPointerUp(e) {
        if (dragRef.current?.pointerId !== e.pointerId) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Capture may already be released — ignore.
        }
        dragRef.current = null;
        document.body.style.cursor = '';
      },
      onPointerCancel(e) {
        if (dragRef.current?.pointerId !== e.pointerId) return;
        dragRef.current = null;
        document.body.style.cursor = '';
      },
      onDoubleClick() {
        setPan({ x: 0, y: 0 });
      },
    }),
    []
  );

  return { pan, handlers };
};
