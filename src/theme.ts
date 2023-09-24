'use client';

import { type MantineTheme, createTheme } from '@mantine/core';

export const theme = createTheme({
  defaultRadius: 'xs',
  fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
  components: {
    TextInput: {
      styles: (theme: MantineTheme) => ({
        label: {
          fontWeight: 'bold'
        },
        root: {
          marginBottom: theme.spacing.xs
        }
      })
    },
    NumberInput: {
      styles: (theme: MantineTheme) => ({
        label: {
          fontWeight: 'bold'
        },
        root: {
          marginBottom: theme.spacing.xs
        }
      })
    },
    RadioGroup: {
      styles: (theme: MantineTheme) => ({
        label: {
          fontWeight: 'bold'
        },
        root: {
          marginBottom: theme.spacing.xs
        }
      })
    },
    Checkbox: {
      styles: (theme: MantineTheme) => ({
        root: {
          marginBottom: theme.spacing.sm
        }
      })
    },
    DatePicker: {
      styles: (theme: MantineTheme) => ({
        label: {
          fontWeight: 'bold'
        },
        day: {
          height: 30
        }
      })
    }
  }
});
