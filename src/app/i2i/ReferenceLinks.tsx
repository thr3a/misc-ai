'use client';

import { Button, Menu, ScrollArea, Stack, Text } from '@mantine/core';
import { IconChevronDown, IconExternalLink, IconLink } from '@tabler/icons-react';

type ReferenceLink = {
  label: string;
  description: string;
  url: string;
};

// 参考サイト。増やすときはここに追加する
const REFERENCE_LINKS: ReferenceLink[] = [
  {
    label: 'ポーズ集',
    description: 'WaveSpeedAI AI Pose Templates',
    url: 'https://wavespeed.ai/ja/free-tools/ai-pose-templates'
  },
  {
    label: '衣装集',
    description: 'AI Costume Gallery',
    url: 'https://ai-costume-gallery.pages.dev/'
  }
];

// 件数が増えても画面を圧迫しないよう、ボタン 1 つのドロップダウンにまとめる
export const ReferenceLinks = () => (
  <Menu position='bottom-end' width={280}>
    <Menu.Target>
      <Button
        variant='default'
        size='xs'
        leftSection={<IconLink size={16} />}
        rightSection={<IconChevronDown size={14} />}
      >
        参考リンク
      </Button>
    </Menu.Target>
    <Menu.Dropdown>
      <ScrollArea.Autosize mah={360}>
        {REFERENCE_LINKS.map((link) => (
          <Menu.Item
            key={link.url}
            component='a'
            href={link.url}
            target='_blank'
            rel='noopener noreferrer'
            rightSection={<IconExternalLink size={14} />}
          >
            <Stack gap={0}>
              <Text size='sm'>{link.label}</Text>
              <Text size='xs' c='dimmed'>
                {link.description}
              </Text>
            </Stack>
          </Menu.Item>
        ))}
      </ScrollArea.Autosize>
    </Menu.Dropdown>
  </Menu>
);
