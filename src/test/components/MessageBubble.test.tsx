import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble, { type Message } from '@/components/room/MessageBubble';

vi.mock('@/components/reaction/SparkButton', () => ({
  default: ({ isSparked, count, onClick, size }: any) => (
    <button 
      data-testid="spark-button" 
      data-sparked={isSparked}
      data-count={count}
      data-size={size}
      onClick={onClick}
    >
      Spark ({count})
    </button>
  ),
}));

describe('MessageBubble Component', () => {
  const mockMessage: Message = {
    id: 'msg1',
    userId: 'me',
    content: 'Hello, this is my message',
    timestamp: '10:30 AM',
    isSparked: false,
    sparkCount: 0,
  };

  const mockPartnerMessage: Message = {
    id: 'msg2',
    userId: 'partner',
    content: 'Hello, this is partner message',
    timestamp: '10:31 AM',
    isSparked: true,
    sparkCount: 5,
  };

  it('should render message from me with correct styling', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockMessage} onSpark={handleSpark} />);

    expect(screen.getByText('Hello, this is my message')).toBeInTheDocument();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();

    const messageBubble = screen.getByText('Hello, this is my message').parentElement;
    expect(messageBubble).toHaveClass('bg-xh-gold/20', 'text-white', 'rounded-tr-none');

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('should render message from partner with correct styling', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockPartnerMessage} onSpark={handleSpark} />);

    expect(screen.getByText('Hello, this is partner message')).toBeInTheDocument();
    expect(screen.getByText('10:31 AM')).toBeInTheDocument();

    const messageBubble = screen.getByText('Hello, this is partner message').parentElement;
    expect(messageBubble).toHaveClass('bg-white/5', 'text-white', 'rounded-tl-none');

    const sparkButton = screen.getByTestId('spark-button');
    expect(sparkButton).toBeInTheDocument();
    expect(sparkButton).toHaveAttribute('data-sparked', 'true');
    expect(sparkButton).toHaveAttribute('data-count', '5');
    expect(sparkButton).toHaveAttribute('data-size', 'sm');
  });

  it('should call onSpark when spark button is clicked on partner message', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockPartnerMessage} onSpark={handleSpark} />);

    const sparkButton = screen.getByTestId('spark-button');
    fireEvent.click(sparkButton);

    expect(handleSpark).toHaveBeenCalledTimes(1);
    expect(handleSpark).toHaveBeenCalledWith('msg2');
  });

  it('should not show spark button for my own messages', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockMessage} onSpark={handleSpark} />);

    expect(screen.queryByTestId('spark-button')).not.toBeInTheDocument();
  });

  it('should apply correct alignment for my messages', () => {
    const handleSpark = vi.fn();
    const { container } = render(<MessageBubble message={mockMessage} onSpark={handleSpark} />);

    const messageContainer = container.firstChild;
    expect(messageContainer).toHaveClass('flex', 'justify-end');
  });

  it('should apply correct alignment for partner messages', () => {
    const handleSpark = vi.fn();
    const { container } = render(<MessageBubble message={mockPartnerMessage} onSpark={handleSpark} />);

    const messageContainer = container.firstChild;
    expect(messageContainer).toHaveClass('flex', 'justify-start');
  });

  it('should apply custom className when provided', () => {
    const handleSpark = vi.fn();
    const { container } = render(
      <MessageBubble message={mockMessage} onSpark={handleSpark} className="custom-class" />
    );

    const messageContainer = container.firstChild;
    expect(messageContainer).toHaveClass('custom-class');
  });

  it('should render timestamp with correct styling', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockMessage} onSpark={handleSpark} />);

    const timestamp = screen.getByText('10:30 AM');
    expect(timestamp).toHaveClass('text-[10px]', 'text-white/25');
  });

  it('should render message content with correct styling', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockMessage} onSpark={handleSpark} />);

    const content = screen.getByText('Hello, this is my message');
    expect(content).toHaveClass('text-sm', 'leading-relaxed');
  });

  it('should handle messages with spark count of zero', () => {
    const messageWithZeroSparks: Message = {
      id: 'msg3',
      userId: 'partner',
      content: 'Message with zero sparks',
      timestamp: '10:32 AM',
      isSparked: false,
      sparkCount: 0,
    };

    const handleSpark = vi.fn();
    render(<MessageBubble message={messageWithZeroSparks} onSpark={handleSpark} />);

    const sparkButton = screen.getByTestId('spark-button');
    expect(sparkButton).toHaveAttribute('data-count', '0');
    expect(sparkButton).toHaveAttribute('data-sparked', 'false');
  });

  it('should handle messages with high spark count', () => {
    const messageWithManySparks: Message = {
      id: 'msg4',
      userId: 'partner',
      content: 'Popular message',
      timestamp: '10:33 AM',
      isSparked: true,
      sparkCount: 999,
    };

    const handleSpark = vi.fn();
    render(<MessageBubble message={messageWithManySparks} onSpark={handleSpark} />);

    const sparkButton = screen.getByTestId('spark-button');
    expect(sparkButton).toHaveAttribute('data-count', '999');
    expect(sparkButton).toHaveAttribute('data-sparked', 'true');
  });

  it('should have proper accessibility attributes', () => {
    const handleSpark = vi.fn();
    render(<MessageBubble message={mockPartnerMessage} onSpark={handleSpark} />);

    const sparkButton = screen.getByTestId('spark-button');
    expect(sparkButton).toBeEnabled();

    const content = screen.getByText('Hello, this is partner message');
    expect(content).toBeInTheDocument();
  });

  it('should render correctly for different message content lengths', () => {
    const longMessage: Message = {
      id: 'msg5',
      userId: 'me',
      content: 'This is a very long message that should wrap properly within the message bubble component and test the rendering of longer content.',
      timestamp: '10:34 AM',
      isSparked: false,
      sparkCount: 0,
    };

    const handleSpark = vi.fn();
    const { container } = render(<MessageBubble message={longMessage} onSpark={handleSpark} />);

    expect(screen.getByText(longMessage.content)).toBeInTheDocument();
    const maxWContainer = container.querySelector('[class*="max-w"]');
    expect(maxWContainer).toBeInTheDocument();
  });
});