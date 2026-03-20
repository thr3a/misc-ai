'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  scale: 1.0,
  defaultRadius: 'xs',
  fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
  components: {
    TextInput: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    Textarea: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        },
        root: {
          fontSize: '16px'
        },
        input: {
          fontSize: '16px'
        }
      })
    },
    NumberInput: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    RadioGroup: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    DatePicker: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        },
        day: {
          height: 30
        }
      })
    },
    Select: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    }
  }
});
