import type { AlignChoice, FontChoice, SizeChoice, WeightChoice } from './journal'

export function fontFamily(font: FontChoice): string {
  switch (font) {
    case 'sans':
      return 'Inter, system-ui, sans-serif'
    case 'serif':
      return 'Georgia, "Times New Roman", serif'
    case 'mono':
      return 'ui-monospace, Consolas, monospace'
    case 'cursive':
      return 'cursive'
    default: {
      const unexpected: never = font
      return unexpected
    }
  }
}

export function fontSize(size: SizeChoice): string {
  switch (size) {
    case 'sm':
      return '0.95rem'
    case 'md':
      return '1.05rem'
    case 'lg':
      return '1.25rem'
    case 'xl':
      return '1.5rem'
    default: {
      const unexpected: never = size
      return unexpected
    }
  }
}

export function fontWeight(weight: WeightChoice): string {
  switch (weight) {
    case 'normal':
      return '400'
    case 'medium':
      return '500'
    case 'bold':
      return '700'
    default: {
      const unexpected: never = weight
      return unexpected
    }
  }
}

export function textAlign(align: AlignChoice): AlignChoice {
  switch (align) {
    case 'left':
    case 'center':
    case 'right':
      return align
    default: {
      const unexpected: never = align
      return unexpected
    }
  }
}
