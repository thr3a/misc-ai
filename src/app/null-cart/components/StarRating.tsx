'use client';

import { Group, Text } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';

type StarRatingProps = {
  rating: number;
  count: number;
};

export const StarRating = ({ rating, count }: StarRatingProps) => {
  const rounded = Math.round(rating);
  return (
    <Group gap={2} align='center'>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rounded ? (
          <IconStarFilled key={star} size={16} color='#FF9900' />
        ) : (
          <IconStar key={star} size={16} color='#FF9900' />
        )
      )}
      <Text size='sm' c='#007185' ml={4}>
        {rating} ({count.toLocaleString()}件)
      </Text>
    </Group>
  );
};
