'use client';

import React from 'react';
import { X, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function VoiceRecorder({ onResult, onClose }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(true);
  const [transcript, setTranscript] = React.useState('');
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音输入');
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isRecording, onClose]);

  const handleStop = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (transcript.trim()) {
      onResult(transcript.trim());
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-xh-dark rounded-2xl p-6 w-full max-w-sm border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">语音输入</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-xh-accent/20 flex items-center justify-center border border-xh-accent/30 animate-pulse">
                <div className={`w-10 h-10 rounded-full transition-colors ${isRecording ? 'bg-xh-accent animate-pulse-glow' : 'bg-green-500'}`} />
              </div>
              <div className="absolute inset-0 rounded-full border border-xh-accent/20 animate-ping-slow" />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 min-h-[80px]">
            <p className="text-sm text-white">
              {transcript || <span className="text-gray-500">请说话，我正在听...</span>}
            </p>
          </div>
        </div>

        <button
          onClick={handleStop}
          className="w-full flex items-center justify-center gap-2 bg-xh-accent text-white py-3 rounded-xl font-medium"
        >
          <Square className="w-4 h-4" />
          {isRecording ? '停止录音' : '确认输入'}
        </button>
      </div>
    </div>
  );
}
