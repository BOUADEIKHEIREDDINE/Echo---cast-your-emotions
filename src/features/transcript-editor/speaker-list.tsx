import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SpeakerListProps {
  speakers: string[];
  onAddSpeaker: (name: string) => void;
  onRenameSpeaker: (oldName: string, newName: string) => void;
  onRemoveSpeaker: (name: string) => void;
}

export const SpeakerList = ({
  speakers,
  onAddSpeaker,
  onRenameSpeaker,
  onRemoveSpeaker,
}: SpeakerListProps) => {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddClick = () => {
    const nameToAdd =
      newSpeakerName.trim() || `Speaker ${speakers.length + 1}`;
    onAddSpeaker(nameToAdd);
    setNewSpeakerName('');
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditValue(speakers[index]);
  };

  const handleEditSave = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      onRenameSpeaker(oldName, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-3 text-foreground">Speakers</h2>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {speakers.map((speaker, index) => (
            <div key={`${speaker}-${index}`} className="flex items-center gap-2">
              {editingIndex === index ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(speaker);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    className="text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(speaker)}
                    className="whitespace-nowrap"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleEditStart(index)}
                    className="flex-1 text-left px-3 py-2 rounded-md border border-input hover:bg-muted text-sm font-medium text-foreground transition-colors"
                  >
                    {speaker}
                  </button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveSpeaker(speaker)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New speaker name..."
          value={newSpeakerName}
          onChange={(e) => setNewSpeakerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddClick();
          }}
          className="text-sm"
        />
        <Button onClick={handleAddClick} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
