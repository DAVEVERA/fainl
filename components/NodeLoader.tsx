import { FC } from 'react';

export type LoaderShape = 'circle' | 'rect' | 'triangle';

interface NodeLoaderProps {
  shape?: LoaderShape;
}

export const NodeLoader: FC<NodeLoaderProps> = ({ shape = 'circle' }) => {
  if (shape === 'circle') {
    return (
      <div className="node-loader">
        <svg viewBox="0 0 80 80">
          <circle r="32" cy="40" cx="40" />
        </svg>
      </div>
    );
  }

  if (shape === 'rect') {
    return (
      <div className="node-loader">
        <svg viewBox="0 0 80 80">
          <rect height="64" width="64" y="8" x="8" />
        </svg>
      </div>
    );
  }

  return (
    <div className="node-loader node-loader--triangle">
      <svg viewBox="0 0 86 80">
        <polygon points="43 8 79 72 7 72" />
      </svg>
    </div>
  );
};

/** Returns the loader shape for a given council member index (cycles through 3) */
export function loaderShapeForIndex(index: number): LoaderShape {
  const shapes: LoaderShape[] = ['circle', 'rect', 'triangle'];
  return shapes[index % 3];
}
