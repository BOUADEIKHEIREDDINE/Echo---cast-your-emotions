import { Button } from '@/components/button';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SpeakerList } from './speaker-list';
import type { TranscriptBlock } from './types';

interface TranscriptEditorProps {
  blocks: TranscriptBlock[];
  onBlockChange: (blockId: string, newText: string) => void;
  onSpeakerChange: (blockId: string, newSpeaker: string) => void;
  speakers: string[];
  onAddSpeaker: (name: string) => void;
  onRenameSpeaker: (oldName: string, newName: string) => void;
  onRemoveSpeaker: (name: string) => void;
  onDownload: () => void;
}

export const TranscriptEditor = ({
  blocks,
  onBlockChange,
  onSpeakerChange,
  speakers,
  onAddSpeaker,
  onRenameSpeaker,
  onRemoveSpeaker,
  onDownload,
}: TranscriptEditorProps) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const hasCitation = (text: string) => {
    // Basic local heuristic: detect common quotation marks.
    // Keeps everything offline and fast; can be refined later.
    return /["“”'‘’]|«|»/.test(text);
  };

  const stats = useMemo(() => {
    const totalChars = blocks.reduce((sum, b) => sum + b.text.length, 0);
    const totalWords = blocks.reduce(
      (sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length,
      0
    );
    return { blocks: blocks.length, chars: totalChars, words: totalWords };
  }, [blocks]);

  const handleEditStart = (block: TranscriptBlock) => {
    setEditingBlockId(block.id);
    setEditText(block.text);
  };

  const handleEditSave = (blockId: string) => {
    if (editText !== blocks.find(b => b.id === blockId)?.text) {
      onBlockChange(blockId, editText);
    }
    setEditingBlockId(null);
  };

  return (
    <div className="flex h-screen gap-0 bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 p-4 overflow-y-auto">
        <SpeakerList
          speakers={speakers}
          onAddSpeaker={onAddSpeaker}
          onRenameSpeaker={onRenameSpeaker}
          onRemoveSpeaker={onRemoveSpeaker}
        />

        <div className="mt-6 pt-4 border-t border-border">
          <Button onClick={onDownload} className="w-full" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Transcript
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            Transcript Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit your transcription and rename speakers
          </p>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3 max-w-4xl">
            {blocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No transcript blocks yet</p>
              </div>
            ) : (
              blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Speaker Selector */}
                  <div className="w-32 shrink-0 space-y-2">
                    <select
                      value={block.speaker}
                      onChange={(e) => onSpeakerChange(block.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {speakers.map((speaker) => (
                        <option key={speaker} value={speaker}>
                          {speaker}
                        </option>
                      ))}
                    </select>

                    {hasCitation(block.text) ? (
                      <div className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Citation
                      </div>
                    ) : null}
                  </div>

                  {/* Text Editor */}
                  {editingBlockId === block.id ? (
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(block.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingBlockId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStart(block)}
                      className="flex-1 text-left px-3 py-2 rounded-md hover:bg-muted border border-transparent text-sm text-foreground whitespace-pre-wrap break-words cursor-text"
                    >
                      {block.text || '(empty)'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          <span>{stats.blocks} blocks</span>
          <span className="mx-2">•</span>
          <span>{stats.words} words</span>
          <span className="mx-2">•</span>
          <span>{stats.chars} characters</span>
        </div>
      </div>
    </div>
  );
};
