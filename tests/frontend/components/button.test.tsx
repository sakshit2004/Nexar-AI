import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button', { name: /outline/i })
    expect(btn).toHaveClass('border')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole('button', { name: /delete/i })
    expect(btn).toHaveClass('bg-destructive')
  })

  it('renders with size lg', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button', { name: /large/i })
    expect(btn).toHaveClass('h-11')
  })

  it('renders with size sm', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button', { name: /small/i })
    expect(btn).toHaveClass('h-9')
  })
})
