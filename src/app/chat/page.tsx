'use client';
import { ActionIcon, Flex, ScrollArea, Stack, Textarea } from '@mantine/core';
import { Box, Button, Group, Paper, TextInput, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { getHotkeyHandler, useLocalStorage } from '@mantine/hooks';
import { IconPlayerStopFilled, IconSend } from '@tabler/icons-react';
import { readStreamableValue } from 'ai/rsc';
import React, { useState, useRef, useEffect } from 'react';
import type { z } from 'zod';
import { Chat } from './Chat';
import { generate } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default function Page() {
  return <Chat />;
}
