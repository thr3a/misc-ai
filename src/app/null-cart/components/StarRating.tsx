'use client';

import { Group, Text } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';

type StarRatingProps = {
  rating: number;
  count: number;
  compact?: boolean;
};

export const StarRating = ({ rating, count, compact = false }: StarRatingProps) => {
  const rounded = Math.round(rating);
  return (
    <Group gap={2} align='center'>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rounded ? (
          <IconStarFilled key={star} size={compact ? 13 : 16} color='#de7921' />
        ) : (
          <IconStar key={star} size={compact ? 13 : 16} color='#de7921' />
        )
      )}
      <Text fz={compact ? 11 : 'sm'} c='#007185' ml={2}>
        {compact ? count.toLocaleString() : `${rating} (${count.toLocaleString()}件)`}
      </Text>
    </Group>
  );
};
