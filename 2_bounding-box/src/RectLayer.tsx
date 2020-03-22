import React, { useReducer, useRef, useEffect } from 'react';

type Pixel = number;
type Radian = number;

interface Layer {
  id: number;
  width: Pixel;
  height: Pixel;
  positionX: Pixel;
  positionY: Pixel;
  rotate: Radian;
}

interface Props {
  src: Layer;
}

function RectLayer({ src, onDragStart, onDragEnd, onMove }: Props) {
  const ref = useDrag("ontouchstart" in window, {
    onMove,
    onDragStart,
    onDragEnd
  });

  return (
    <rect
      fill="orange"
      width={src.width}
      height={src.height}
      x={src.positionX}
      y={src.positionY}
      transform={`rotate(${src.rotate})`}
    />
  );
}

interface State {
  layers: Layer[];
}

const initialState = {
  layers: [
    {
      id: 1,
      width: 200,
      height: 100,
      positionX: 0,
      positionY: 0,
      rotate: 0
    }
  ]
};

const layerMoved = () => ({ ... })

const reducer = (
  currentState = initialState,
  action: { type: string; payload: any }
) => {
  switch (action.type) {
    case 'layer/moved': {
      return ...
    }
  }
}

function Canvas() {
  const [state, dispatch] = useReducer(reducer, initialState);
}

const ref = useRef<SVGRectElement | null>(null);

useEffect(() => {
  const draggable = makeDraggable(ref.current!, isTouchDevice, {
    onMove,
    onDragStart,
    onDragEnd
  });

  return () => {
    dtaggable.destroy();
  };
}, []);

export interface Draggable {
  destroy(): void;
}

export class TouchDraggable<E extends SVGElement> implements Draggable {}

export class MouseDraggable<E extends SVGElement> implements Draggable {}

export interface Handlers {
  onMove(dx: Pixel, dy: Pixel): void;
  onDragStart(x: Pixel, y: Pixel, e: Event): void;
  onDragEnd(e: Event): void;
}

const passive = { passive: true }

constructor(private element: E, private handlers: Handlers) {
  this.Element.addEventListener("touchstart", this._onTouchStart, passive);
  this.Element.addEventListener("touchmove", this._onTouchMove, passive);
  this.Element.addEventListener("touchend", this._onTouchEnd, passive);
}

destroy() {
  this.Element.removeEventListener("touchstart", this._onTouchStart);
  this.Element.removeEventListener("touchmove", this._onTouchMove);
  this.Element.removeEventListener("touchend", this._onTouchEnd);
}

private initialTouch?: { x: Pixel, y: Pixel }

private readonly _onTouchStart = (e: TouchEvent) => {
  e.stopPropagation();

  // 通常ありえない
  if(!e.currentTarget || !e.target) {
    return;
  }

  // ピンチズームとかで誤作動させない
  if(e.changedTouches.length !== 1) {
    return;
  }

  const touch = e.changedTouches[0];
  const x = touch.clientX;
  const y = touch.clientY;

  this.initialTouch = { x, y };
  this.handlers.onDragStart(x, y, e);
}

private readonly _onTouchMove = (e: TouchEvent) => {
  e.stopPropagation();

  // 通常ありえない
  if(!e.currentTarget || !e.target) {
    return;
  }

  // ピンチズームとかで誤作動させない
  if(e.changedTouches.length !== 1) {
    return;
  }

  if(this.initialTouch === undefined) {
    return;
  }

  const { x, y } = this.initialTouch;
  const { clientX, clientY } = e.changedTouches[0];

  this.handlers.onMove(clientX - x, clientY - y);
};

private readonly _onTouchEnd = (e: TouchEvent) => {
  e.stopPropagation();

  this.handlers.onDragEnd(e);
  this.initialTouch = undefined;
}

function useDrag(isTouchDevice: boolean, handlers: Handlers) {
  const ref = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    const draggable = makeDraggable(ref.current!, isTouchDevice, {
      onMove,
      onDragStart,
      onDragEnd
    });

    return () => {
      draggable.destroy();
    };
  }, []);

  return ref;
}

const LayerActions {
  moveStarted = (id: Layer['id']) => action('layer/moveStarted', { id }),
  moved = (dx: Pixel, dy: Pixel) => action('layer/moved', { dx, dy }),
  moveEnded = () => action('layer/moveEnded', {}),
}

const action = <T extends string, P>(type: T, payload: P) => ({ type, payload })

type KnownLayerActions = ReturnType<
  typeof LayerActions[keyof typeof LayerActions]
>

// reducer の網羅性検証を型安全に行うためのユーティリティ
const unreduceable = (unknownAction: never) => void unknownAction

export default RectLayer;


// 41 ~
