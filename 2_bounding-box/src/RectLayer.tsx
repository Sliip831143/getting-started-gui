import React, { useReducer, useRef, useEffect } from 'react';
import produce from 'immer';
import pick from 'lodash-es/pick';

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
  parentSize: [Pixel, Pixel];
  onDrag(x: Pixel, y: Pixel, e: Event): void;
  onDragStart(): void;
  onDragEnd(): void;
  src: Layer;
  isSelected: boolean;
}

const HANDLE_SIZE = 10 as Pixel;

/**
 * 実際のリサイズハンドラよりもどのくらい当たり判定を大きくするか
 */

const TOLERANCE = 4 as Pixel;

function ResizeHandler({
  positionX,
  positionY,
  parentSize,
  onDrag,
  onDragStart,
  onDragEnd
}: Props) {
  const ref = useDrag({
    onMove,
    onDragStart,
    onDragEnd
  });

  const [width, height] = parentSize;
  const x = width - HANDLE_SIZE / 2;
  const y = height - HANDLE_SIZE / 2;

  return (
    <g>
      <rect
        fill="white"
        stroke="#666666"
        strokeWidth="1"
        width={HANDLE_SIZE}
        height={HANDLE_SIZE}
        x={x}
        y={y}
      />

      {/** 上に透明な当たり判定を大きめにかぶせる */}
      <rect
        ref={ref}
        fillOpacity="0"
        width={HANDLE_SIZE + TOLERANCE * 2}
        height={HANDLE_SIZE + TOLERANCE * 2}
        x={x - TOLERANCE}
        y={y - TOLERANCE}
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

function RectLayer({ src, isSelected, onDragStart, onDragEnd, onMove }: Props) {
  const ref = useDrag("ontouchstart" in window, {
    onMove,
    onDragStart,
    onDragEnd
  });

  return (
    <svg
      viewBox={`0 0 ${src.width} ${src.height}`}
      width={src.width}
      height={src.height}
    >
      {/** レイヤー本体の rect */}
      <rect
        fill="orange"
        width={src.width}
        height={src.height}
        x={src.positionX}
        y={src.positionY}
        transform={`rotate(${src.rotate})`}
      />

      {/** リサイズハンドラの白い四角形 */}
      <ResizeHandler ... />
    </svg>
  );
}

interface State {
  layers: Layer[];
  initialTransforms: Record<Layer["id"], Transform>;
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
  ],
  initialTransforms: {}
};

const layerMoved = () => ({ ... })

const reducer = (
  currentState = initialState,
  action: KnownLayerActions
) => {
  produce(currentState, state => {
    switch (action.type) {
      case 'layer/moveStarted': {
        state.layers.forEach(layer => {
          state.initialTransforms[layer.id] = pick(layer, [
            'width',
            'height',
            'positionX',
            'positionY',
            'rotate'
          ]);
        });
        break;
      }
      case 'layer/moved': {
        const { dx, dy } = action.payload;

        state.layers.forEach(layer => {
          const transform = state.initialTransforms[layer.id];
          if(!transform) {
            return;
          }

          const { x, y } = transform;
          layer.x = x + dx;
          layer.y = y + dy;
        });
        break;
      }
      case 'layer/moveEnded': {
        state.initialTransforms = {};
        break;
      }
      case 'layer/resized': {
        const { dx, dy } = action.payload

        state.layers.forEach(layer => {
          const transform = state.initialTransforms[layer.id];
          if(!transform) {
            return;
          }

          const { width, height } = transform;
          layer.width = x + dx;
          layer.height = y + dy;
        });

        break;
      }
      case 'layer/rotated': {
        const { id, nextTheta } = action.payload;
        const layer = state.layers.find(layer => layer.id === id);

        if(layer) {
          layer.rotate = nextTheta;
        }
        break;
      }

      default: {
        unreduceable(action);
        break;
      }
    }
  });
}

function Canvas() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const onDragStart = (_x: Pixel, _y: Pixel, e: Event) => {
    const layerId = Number(e.currentTarget.dataset.layerId);

    dispatch(LayerActions.moveStarted(layerId));
  };

  const onMove = (dx: number, dy: number) => {
    dispatch(LayerActions.moved(dx, dy));
  };

  const onDragEnd = () => {
    e.stopPropagation();
    dispatch(LayerActions.dragEnded());
  };

  return (
    <svg id="canvas" viewBox="0 0 500 500" width="500" height="500">
      {state.layers.map(layer => (
        <RectLayer
          key={layer.id}
          src={layer}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onMove={onMove}
        />
      ))}
    </svg>
  )
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

function RotateHandler({ onMove, onDragStart, onDragEnd }: Props) {
  const ref = useDrag({
    onMove,
    onDragStart,
    onDragEnd
  });

  const onMove = (_dx: Pixel, _dy: Pixel, x: Pixel, y: Pixel) => {
    const [cx, cy] = props.parentCenter;

    /** θ の隣辺の長さ（ x 方向） */
    const vx = x - cx;

    /** θ の対辺の長さ（ y 方向） */
    const vy = y - cy;

    /** θ：回転角（ラジアン） */
    const nextTheta = Math.atan2(vy, vx);

    dispatch(LayerActions.rotate(layer.id, nextTheta));
  };
}

const LayerActions {
  moveStarted = (id: Layer['id']) => action('layer/moveStarted', { id }),
  moved = (dx: Pixel, dy: Pixel) => action('layer/moved', { dx, dy }),
  moveEnded = () => action('layer/moveEnded', {}),
  resized = (dx: Pixel, dy: Pixel) => action('layer/resized', { dx, dy })
}

const action = <T extends string, P>(type: T, payload: P) => ({ type, payload })

type KnownLayerActions = ReturnType<
  typeof LayerActions[keyof typeof LayerActions]
>

// reducer の網羅性検証を型安全に行うためのユーティリティ
const unreduceable = (unknownAction: never) => void unknownAction

type Transform = Pick<
  Layer,
  "width" | "height" | "positionX" | "positionY" | "rotate"
>;


export default RectLayer;

// 2.5 拡大と縮小から（p:44）
