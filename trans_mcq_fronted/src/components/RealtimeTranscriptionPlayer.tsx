// src/components/RealtimeTranscriptionPlayer.tsx
/**
 * Real-Time Transcription Video Player
 * Displays live transcript updates while video plays
 * Supports multiple languages: English, Hindi, Marathi, Kannada, Telugu
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Volume1, VolumeX, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TranscriptSegment {
  timestamp: { start: number; end: number };
  text: string;
  isFinal: boolean;
  confidence: number;
  speaker?: string;
  language: string;
}

interface RealtimeTranscriptionPlayerProps {
  videoUrl: string;
  fileId: string;
  language: 'en' | 'hi' | 'mr' | 'kn' | 'te';
  onLanguageChange: (lang: string) => void;
  onTranscriptionComplete: (segments: TranscriptSegment[]) => void;
}

const LANGUAGE_NAMES = {
  'en': 'English',
  'hi': 'हिंदी',
  'mr': 'मराठी',
  'kn': 'ಕನ್ನಡ',
  'te': 'తెలుగు'
};

const RealtimeTranscriptionPlayer: React.FC<RealtimeTranscriptionPlayerProps> = ({
  videoUrl,
  fileId,
  language,
  onLanguageChange,
  onTranscriptionComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API for browser-based transcription
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported. Using server-based transcription.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    // Language code mapping
    const languageCodeMap: Record<string, string> = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'kn': 'kn-IN',
      'te': 'te-IN'
    };

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageCodeMap[selectedLanguage] || 'en-IN';

    recognition.onstart = () => {
      setIsTranscribing(true);
      console.log('Transcription started');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          // Add final segment
          const newSegment: TranscriptSegment = {
            timestamp: {
              start: Math.floor(videoRef.current?.currentTime || 0),
              end: Math.floor((videoRef.current?.currentTime || 0) + 5)
            },
            text: transcript,
            isFinal: true,
            confidence,
            speaker: 'Speaker',
            language: selectedLanguage
          };

          setTranscriptSegments(prev => [...prev, newSegment]);
          finalConfidence = confidence;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      setTranscriptionConfidence(finalConfidence);

      // Auto-scroll transcript
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
      console.log('Transcription ended');
    };

    return () => {
      recognition.abort();
    };
  }, [selectedLanguage]);

  // Start/Stop transcription based on video playback
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isPlaying && !isTranscribing) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    } else if (!isPlaying && isTranscribing) {
      recognitionRef.current.stop();
    }
  }, [isPlaying, isTranscribing]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    onLanguageChange(newLang);
    
    // Reset transcription
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setTranscriptSegments([]);
    setInterimTranscript('');
  };

  const finishTranscription = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Call callback with segments
    onTranscriptionComplete(transcriptSegments);

    console.log('Transcription completed:', {
      segmentCount: transcriptSegments.length,
      totalText: transcriptSegments.map(s => s.text).join(' ')
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCurrentSegmentText = (): string => {
    return transcriptSegments
      .filter(seg => seg.timestamp.start <= currentTime && currentTime <= seg.timestamp.end)
      .map(seg => seg.text)
      .join(' ') || 'Waiting for speech...';
  };

  return (
    <div className="w-full space-y-4">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <video
            ref={videoRef}
            className="w-full rounded-t-lg"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            src={videoUrl}
          />

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 space-y-2">
            {/* Progress Bar */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />

            {/* Control Buttons */}
            <div className="flex items-center gap-2 text-white">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={16} />
                  ) : volume < 50 ? (
                    <Volume1 size={16} />
                  ) : (
                    <Volume2 size={16} />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>

              {/* Time Display */}
              <div className="ml-auto text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Live Indicator */}
          {isTranscribing && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transcription Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Language Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Transcription Language</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <Button
                    key={code}
                    variant={selectedLanguage === code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange(code)}
                    disabled={isTranscribing}
                  >
                    {code.toUpperCase()}: {name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Transcription Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Transcription Status</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isTranscribing ? 'default' : 'secondary'}>
                    {isTranscribing ? '🎤 Recording' : '⏹️ Stopped'}
                  </Badge>
                  {transcriptionConfidence > 0 && (
                    <Badge variant="outline">
                      Confidence: {Math.round(transcriptionConfidence * 100)}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Segments captured: {transcriptSegments.length}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={finishTranscription} disabled={transcriptSegments.length === 0}>
              Complete Transcription
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTranscriptSegments([]);
                setInterimTranscript('');
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Realtime Transcript Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Transcript</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)}
              </span>
              {isTranscribing && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={transcriptRef}
            className="space-y-3 bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto border border-gray-200"
          >
            {transcriptSegments.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                Start video playback to begin transcription...
              </p>
            )}

            {transcriptSegments.map((segment, idx) => (
              <div
                key={idx}
                className="pb-3 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {segment.speaker || 'Speaker'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(segment.timestamp.start)}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${getConfidenceColor(
                          segment.confidence
                        )}`}
                        title={`Confidence: ${Math.round(segment.confidence * 100)}%`}
                      />
                    </div>
                    <p className="text-sm text-gray-800">{segment.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Interim Transcript */}
            {interimTranscript && (
              <div className="pb-3 border-b border-gray-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">interim</span>
                  <div className="animate-pulse">
                    <span className="text-xs text-gray-500">listening...</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">{interimTranscript}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Summary */}
      {transcriptSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transcript Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-lg font-semibold">
                  {formatTime(
                    transcriptSegments[transcriptSegments.length - 1]?.timestamp.end || 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Segments</p>
                <p className="text-lg font-semibold">{transcriptSegments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Confidence</p>
                <p className="text-lg font-semibold">
                  {Math.round(
                    (transcriptSegments.reduce((sum, s) => sum + s.confidence, 0) /
                      transcriptSegments.length) *
                      100
                  )}
                  %
                </p>
              </div>
            </div>

            {/* Full Text */}
            <div>
              <p className="text-sm font-medium mb-2">Full Transcript</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {transcriptSegments.map(s => s.text).join(' ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtimeTranscriptionPlayer;
