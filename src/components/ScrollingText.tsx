import React, { useEffect, useState } from "react";
import { Text } from "ink";

interface ScrollingTextProps {
  text: string;
  maxLength: number;
  isActive: boolean;
  interval?: number;
  scrollingSpeed?: number;
  pauseAtEnd?: number;
  color?: string;
  bold?: boolean;
  inverse?: boolean;
}

export function ScrollingText({
  text,
  maxLength,
  isActive,
  interval = 3000,
  scrollingSpeed = 300,
  pauseAtEnd = 2000,
  color,
  bold,
  inverse,
}: ScrollingTextProps) {
  // Default truncated view with ellipsis
  const truncatedText = text.length > maxLength 
    ? text.slice(0, maxLength - 3) + "..." 
    : text;
  
  // State to track current scroll position and displayed text
  const [displayText, setDisplayText] = useState(truncatedText);
  const [scrollState, setScrollState] = useState<'idle'|'scrolling'|'paused'>('idle');
  const [position, setPosition] = useState(0);
  
  // Only animate if text is longer than maxLength and component is active
  const needsScrolling = text.length > maxLength && isActive;
  
  useEffect(() => {
    if (!needsScrolling) {
      // Reset to truncated text when not active
      setDisplayText(truncatedText);
      setPosition(0);
      setScrollState('idle');
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    
    if (scrollState === 'idle') {
      // Initial delay before starting scroll
      timeoutId = setTimeout(() => {
        setScrollState('scrolling');
        setPosition(0);
      }, interval);
    } else if (scrollState === 'scrolling') {
      // Perform scrolling
      timeoutId = setTimeout(() => {
        if (position >= text.length - maxLength) {
          // Reached the end, pause here
          setScrollState('paused');
          // Show the final portion of text without ellipsis
          setDisplayText(text.slice(text.length - maxLength));
        } else {
          // Update the display text with a sliding window, no ellipsis during scroll
          setDisplayText(text.slice(position, position + maxLength));
          setPosition(position + 1);
        }
      }, scrollingSpeed);
    } else if (scrollState === 'paused') {
      // Pause at the end before restarting
      timeoutId = setTimeout(() => {
        setScrollState('idle');
        setPosition(0);
        setDisplayText(truncatedText);
      }, pauseAtEnd);
    }
    
    return () => clearTimeout(timeoutId);
  }, [needsScrolling, scrollState, position, text, maxLength, truncatedText, interval, scrollingSpeed, pauseAtEnd]);
  
  // Pass through the styling props to Text
  const textProps = { color, bold, inverse };
  
  // Return the text directly if no special rendering is needed
  if (text.length <= maxLength) {
    return <Text {...textProps}>{text}</Text>;
  }
  
  return (
    <Text {...textProps}>{displayText}</Text>
  );
}
