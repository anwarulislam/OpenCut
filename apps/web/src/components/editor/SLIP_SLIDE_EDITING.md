# Slip/Slide Editing Feature

This document explains the advanced slip/slide editing functionality implemented in the timeline editor.

## Overview

Slip/slide editing are professional video editing techniques that allow for precise control over clip timing and content:

- **Slip Editing**: Changes the in/out points of a clip without changing its position or duration on the timeline
- **Slide Editing**: Moves a clip along the timeline while automatically adjusting adjacent clips to maintain continuity

## Features Implemented

### 1. Editing Modes
- **Normal Mode**: Standard timeline editing (default)
- **Slip Mode**: Enables slip editing functionality
- **Slide Mode**: Enables slide editing functionality

### 2. User Interface
- **Mode Toolbar**: Located at the top of the timeline with three mode buttons
- **Visual Feedback**: Active slip/slide operations show a blue ring around the element
- **Tooltips**: Comprehensive help text for each mode

### 3. Keyboard Shortcuts
- **1**: Switch to Normal mode
- **2**: Switch to Slip mode  
- **3**: Switch to Slide mode
- **ESC**: Cancel active slip/slide operation

### 4. Mouse Interactions
- **Alt + Drag**: Perform slip editing (in slip mode)
- **Shift + Drag**: Perform slide editing (in slide mode)

## How to Use

### Slip Editing
1. Switch to Slip mode (press `2` or click the slip button)
2. Hold `Alt` and drag a video/audio clip left or right
3. The clip's position and duration remain the same, but the content shifts
4. Only works with video and audio clips (not text or images)

### Slide Editing  
1. Switch to Slide mode (press `3` or click the slide button)
2. Hold `Shift` and drag any clip left or right
3. The clip moves along the timeline
4. Adjacent clips automatically adjust their trim points to maintain continuity
5. Works with all clip types

## Technical Implementation

### Core Components

1. **useSlipSlideEditing Hook** (`/hooks/use-slip-slide-editing.ts`)
   - Manages slip/slide editing state and logic
   - Handles mouse interactions and calculations
   - Provides validation for slip-compatible elements

2. **SlipSlideToolbar Component** (`/components/editor/slip-slide-toolbar.tsx`)
   - Mode selection interface
   - Visual feedback for active editing
   - Keyboard shortcut hints

3. **Timeline Integration**
   - Updated `TimelineElement` component to handle slip/slide interactions
   - Updated `TimelineTrackContent` to pass editing props
   - Updated main `Timeline` component with mode management

### Key Features

- **Frame-accurate editing**: All operations respect project FPS settings
- **Overlap prevention**: Prevents invalid edits that would cause overlaps
- **Undo/Redo support**: All slip/slide operations are recorded in history
- **Multi-track support**: Works across different track types
- **Real-time feedback**: Visual updates during drag operations

### Constraints and Validation

- **Slip editing** only works with video and audio clips (they have timeline content)
- **Slide editing** respects adjacent clip boundaries
- **Source material limits**: Can't slip beyond the original media duration
- **Minimum duration**: Maintains minimum visible duration of 0.1 seconds

## Usage Examples

### Example 1: Slip Editing a Video Clip
```
Before: [----VIDEO CLIP----] (showing seconds 10-20 of a 30-second video)
After:  [----VIDEO CLIP----] (showing seconds 15-25 of the same video)
Position and duration unchanged, content shifted
```

### Example 2: Slide Editing with Adjacent Clips
```
Before: [CLIP A][CLIP B][CLIP C]
Slide CLIP B right:
After:  [CLIP A---][CLIP B][--CLIP C]
CLIP A extended, CLIP C trimmed to maintain continuity
```

## Benefits

1. **Professional Workflow**: Industry-standard editing techniques
2. **Precise Control**: Frame-accurate content and timing adjustments  
3. **Non-destructive**: Original media files remain unchanged
4. **Efficient**: Quick adjustments without manual trimming
5. **Intuitive**: Visual feedback and clear mode indicators

## Future Enhancements

- **Ripple editing**: Moving clips affects all subsequent clips
- **Magnetic timeline**: Automatic snapping to other elements
- **Multi-selection**: Slip/slide multiple clips simultaneously
- **Audio waveform preview**: Visual feedback during slip operations