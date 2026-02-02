import React from 'react';
import { ANSWER_COLORS, ANSWER_SHAPES } from '../../lib/constants';
import { Triangle } from './Triangle';
import { Diamond } from './Diamond';
import { Circle } from './Circle';
import { Square } from './Square';
import { Hexagon } from './Hexagon';
import { Star } from './Star';
import { Pentagon } from './Pentagon';
import { Heart } from './Heart';

interface AnswerShapeProps {
  index: number;
  color?: string;
  size?: number;
  className?: string;
}

const SHAPE_COMPONENTS: Record<
  string,
  React.FC<{ color?: string; size?: number; className?: string }>
> = {
  triangle: Triangle,
  diamond: Diamond,
  circle: Circle,
  square: Square,
  hexagon: Hexagon,
  star: Star,
  pentagon: Pentagon,
  heart: Heart,
};

export const AnswerShape: React.FC<AnswerShapeProps> = ({
  index,
  color,
  size,
  className,
}) => {
  const safeIndex = Math.max(0, Math.min(index, ANSWER_SHAPES.length - 1));
  const shapeName = ANSWER_SHAPES[safeIndex];
  const defaultColor = ANSWER_COLORS[safeIndex];
  const ShapeComponent = SHAPE_COMPONENTS[shapeName];

  if (!ShapeComponent) return null;

  return (
    <ShapeComponent
      color={color ?? defaultColor}
      size={size}
      className={className}
    />
  );
};

export default AnswerShape;
