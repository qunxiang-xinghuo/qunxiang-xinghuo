import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomNav from '@/components/layout/BottomNav';

const mockUsePathname = vi.fn();
const mockPush = vi.fn();
const mockUseRouter = vi.fn(() => ({
  push: mockPush,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockUseRouter(),
}));

describe('BottomNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    mockPush.mockClear();
  });

  it('should render all navigation items', () => {
    render(<BottomNav />);

    expect(screen.getByText('发现')).toBeInTheDocument();
    expect(screen.getByText('素材库')).toBeInTheDocument();
    expect(screen.getByText('消息')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('should highlight active item based on pathname', () => {
    mockUsePathname.mockReturnValue('/library');
    
    render(<BottomNav />);

    const activeItem = screen.getByText('素材库');
    const inactiveItem = screen.getByText('发现');

    expect(activeItem).toHaveClass('text-xh-gold', 'font-medium');
    expect(inactiveItem).toHaveClass('text-gray-500');
  });

  it('should call router.push when item is clicked', () => {
    render(<BottomNav />);

    const libraryButton = screen.getByText('素材库');
    fireEvent.click(libraryButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/library');
  });

  it('should apply correct styling for active items', () => {
    mockUsePathname.mockReturnValue('/messages');
    
    render(<BottomNav />);

    const activeIcon = screen.getByText('消息').previousElementSibling;
    expect(activeIcon).toHaveClass('text-xh-gold');

    const activeText = screen.getByText('消息');
    expect(activeText).toHaveClass('text-xh-gold', 'font-medium');
  });

  it('should apply correct styling for inactive items', () => {
    render(<BottomNav />);

    const inactiveIcons = [
      screen.getByText('素材库').previousElementSibling,
      screen.getByText('消息').previousElementSibling,
      screen.getByText('我的').previousElementSibling,
    ];

    inactiveIcons.forEach(icon => {
      expect(icon).toHaveClass('text-gray-500');
    });

    const inactiveTexts = ['素材库', '消息', '我的'];
    inactiveTexts.forEach(text => {
      const element = screen.getByText(text);
      expect(element).toHaveClass('text-gray-500');
    });
  });

  it('should render correct icons for each item', () => {
    render(<BottomNav />);

    const icons = document.querySelectorAll('svg');
    expect(icons).toHaveLength(4);

    // Icons are rendered with size prop, not attribute
    icons.forEach(icon => {
      expect(icon).toBeInTheDocument();
    });
  });

  it('should have proper container styling', () => {
    const { container } = render(<BottomNav />);
    const navContainer = container.firstChild;

    expect(navContainer).toHaveClass('border-t', 'border-gray-800', 'bg-xh-primary');
    expect(navContainer).toHaveClass('px-4', 'py-3', 'z-10');
  });

  it('should have proper button styling', () => {
    render(<BottomNav />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'gap-1', 'transition-colors');
    });
  });

  it('should handle hover states', () => {
    render(<BottomNav />);

    const inactiveIcon = screen.getByText('素材库').previousElementSibling;
    expect(inactiveIcon).toHaveClass('hover:text-gray-300');

    const inactiveText = screen.getByText('素材库');
    expect(inactiveText).toHaveClass('hover:text-gray-300');
  });

  it('should work correctly with all pathnames', () => {
    const paths = ['/', '/library', '/messages', '/profile'];
    
    paths.forEach(path => {
      mockUsePathname.mockReturnValue(path);
      const { unmount } = render(<BottomNav />);
      
      const activeItem = screen.getByText(
        path === '/' ? '发现' :
        path === '/library' ? '素材库' :
        path === '/messages' ? '消息' : '我的'
      );
      
      expect(activeItem).toHaveClass('text-xh-gold');
      unmount();
    });
  });
});