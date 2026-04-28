import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '@/components/layout/TopBar';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}));

describe('TopBar Component', () => {
  it('should render with default logo and title', () => {
    render(<TopBar />);

    expect(screen.getByText('群像·星火')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<TopBar title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.queryByText('群像·星火')).not.toBeInTheDocument();
  });

  it('should render back button when showBack is true', () => {
    render(<TopBar showBack={true} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveClass('bg-gray-800');
  });

  it('should call onBack when back button is clicked', () => {
    const handleBack = vi.fn();
    render(<TopBar showBack={true} onBack={handleBack} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('should render notification and profile buttons when no title is provided', () => {
    render(<TopBar />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[1].closest('a')).toHaveAttribute('href', '/profile');
  });

  it('should not render notification and profile buttons when title is provided', () => {
    render(<TopBar title="Test Page" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('should apply correct styling for back button', () => {
    render(<TopBar showBack={true} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass('p-2', 'rounded-full', 'bg-gray-800', 'text-gray-400');
  });

  it('should have proper accessibility attributes', () => {
    render(<TopBar showBack={true} title="Test Page" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeEnabled();

    const title = screen.getByText('Test Page');
    expect(title).toHaveAttribute('class');
  });

  it('should call onBack when back button is clicked', () => {
    const handleBack = vi.fn();
    render(<TopBar showBack={true} onBack={handleBack} />);
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(b => b.querySelector('svg path[d="M15 19l-7-7 7-7"]'));
    fireEvent.click(backButton!);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('should render notification and profile buttons when no title is provided', () => {
    render(<TopBar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    const profileLink = document.querySelector('a[href="/profile"]');
    expect(profileLink).toBeInTheDocument();
  });

  it('should not render notification and profile buttons when title is provided', () => {
    render(<TopBar title="Test Page" />);
    const profileLink = document.querySelector('a[href="/profile"]');
    expect(profileLink).not.toBeInTheDocument();
  });

  it('should apply correct styling for back button', () => {
    render(<TopBar showBack={true} />);
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(b => b.querySelector('svg path[d="M15 19l-7-7 7-7"]'));
    expect(backButton).toHaveClass('p-2', 'rounded-full', 'bg-gray-800');
  });

  it('should apply correct styling for title', () => {
    render(<TopBar title="Test Page" />);
    const title = screen.getByText('Test Page');
    expect(title).toHaveClass('text-center', 'text-lg', 'font-medium', 'text-white');
  });

  it('should apply correct styling for logo', () => {
    render(<TopBar />);
    const logoText = screen.getByText('群像·星火');
    expect(logoText).toHaveClass('text-xl', 'font-bold', 'tracking-wider', 'text-white');
  });

  it('should have proper accessibility attributes', () => {
    render(<TopBar showBack={true} title="Test Page" />);
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(b => b.querySelector('svg path[d="M15 19l-7-7 7-7"]'));
    expect(backButton).toBeEnabled();
    const title = screen.getByText('Test Page');
    expect(title).toHaveAttribute('class');
  });

  it('should render star icon in logo', () => {
    render(<TopBar />);
    const starIcon = document.querySelector('svg[viewBox="0 0 24 24"]');
    expect(starIcon).toBeInTheDocument();
    expect(starIcon).toHaveClass('w-6', 'h-6', 'text-xh-gold');
  });
});
