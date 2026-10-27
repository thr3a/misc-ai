import { Badge, Button, CloseButton, ColorInput, ColorSwatch, Group, Input, Stack } from '@mantine/core';
import { useState } from 'react';
import { HEX_COLOR } from './draft';

type Props = {
  label: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
};

// 配色（#RRGGBB の配列）の編集。読み込んだ JSON に色名などが入っていてもそのまま表示・削除できる
export const PaletteInput = ({ label, description, value, onChange }: Props) => {
  const [color, setColor] = useState('#E03131');
  const canAdd = HEX_COLOR.test(color);

  return (
    <Input.Wrapper label={label} description={description}>
      <Stack gap='xs' mt={4}>
        {value.length > 0 && (
          <Group gap='xs'>
            {value.map((c, i) => (
              <Badge
                key={`${c}-${i}`}
                variant='default'
                tt='none'
                leftSection={HEX_COLOR.test(c) ? <ColorSwatch color={c} size={12} /> : undefined}
                rightSection={
                  <CloseButton
                    size='xs'
                    aria-label={`${c} を削除`}
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                  />
                }
              >
                {c}
              </Badge>
            ))}
          </Group>
        )}
        <Group gap='xs'>
          <ColorInput size='xs' w={140} value={color} onChange={setColor} format='hex' />
          <Button
            size='xs'
            variant='default'
            disabled={!canAdd}
            onClick={() => onChange([...value, color.toUpperCase()])}
          >
            追加
          </Button>
        </Group>
      </Stack>
    </Input.Wrapper>
  );
};
