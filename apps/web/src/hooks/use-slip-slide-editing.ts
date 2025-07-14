import { useState, useEffect, useCallback } from "react";
import { TimelineElement, TimelineTrack } from "@/types/timeline";
import { useMediaStore } from "@/stores/media-store";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

export type EditingMode = "normal" | "slip" | "slide";

interface SlipSlideState {
    mode: EditingMode;
    elementId: string | null;
    trackId: string | null;
    startMouseX: number;
    initialTrimStart: number;
    initialTrimEnd: number;
    initialStartTime: number;
    originalAdjacentElements: {
        left?: { id: string; startTime: number; duration: number };
        right?: { id: string; startTime: number; duration: number };
    };
}

interface UseSlipSlideEditingProps {
    tracks: TimelineTrack[];
    zoomLevel: number;
    onUpdateTrim: (
        trackId: string,
        elementId: string,
        trimStart: number,
        trimEnd: number
    ) => void;
    onUpdateElementStartTime: (
        trackId: string,
        elementId: string,
        startTime: number
    ) => void;
    onUpdateElementDuration: (
        trackId: string,
        elementId: string,
        duration: number
    ) => void;
}

export function useSlipSlideEditing({
    tracks,
    zoomLevel,
    onUpdateTrim,
    onUpdateElementStartTime,
    onUpdateElementDuration,
}: UseSlipSlideEditingProps) {
    const [editingState, setEditingState] = useState<SlipSlideState>({
        mode: "normal",
        elementId: null,
        trackId: null,
        startMouseX: 0,
        initialTrimStart: 0,
        initialTrimEnd: 0,
        initialStartTime: 0,
        originalAdjacentElements: {},
    });

    const { mediaItems } = useMediaStore();

    // Set up document-level mouse listeners during slip/slide editing
    useEffect(() => {
        if (editingState.mode === "normal" || !editingState.elementId) return;

        const handleDocumentMouseMove = (e: MouseEvent) => {
            handleSlipSlideMove({ clientX: e.clientX });
        };

        const handleDocumentMouseUp = () => {
            endSlipSlideEditing();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                cancelSlipSlideEditing();
            }
        };

        document.addEventListener("mousemove", handleDocumentMouseMove);
        document.addEventListener("mouseup", handleDocumentMouseUp);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousemove", handleDocumentMouseMove);
            document.removeEventListener("mouseup", handleDocumentMouseUp);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [editingState]);

    const getElementById = useCallback(
        (trackId: string, elementId: string): TimelineElement | null => {
            const track = tracks.find((t) => t.id === trackId);
            return track?.elements.find((e) => e.id === elementId) || null;
        },
        [tracks]
    );

    const getAdjacentElements = useCallback(
        (trackId: string, elementId: string) => {
            const track = tracks.find((t) => t.id === trackId);
            if (!track) return { left: null, right: null };

            const element = track.elements.find((e) => e.id === elementId);
            if (!element) return { left: null, right: null };

            const sortedElements = [...track.elements].sort(
                (a, b) => a.startTime - b.startTime
            );
            const elementIndex = sortedElements.findIndex((e) => e.id === elementId);

            const leftElement = elementIndex > 0 ? sortedElements[elementIndex - 1] : null;
            const rightElement = elementIndex < sortedElements.length - 1 ? sortedElements[elementIndex + 1] : null;

            return { left: leftElement, right: rightElement };
        },
        [tracks]
    );

    const canSlipElement = useCallback(
        (element: TimelineElement): boolean => {
            if (element.type === "text") {
                // Text elements can't be slipped as they don't have source material
                return false;
            }

            if (element.type === "media") {
                const mediaItem = mediaItems.find((item) => item.id === element.mediaId);
                if (!mediaItem) return false;

                // Only video and audio can be slipped (they have timeline content)
                // Images can't be slipped as they're static
                return mediaItem.type === "video" || mediaItem.type === "audio";
            }

            return false;
        },
        [mediaItems]
    );

    const startSlipEditing = useCallback(
        (e: React.MouseEvent, element: TimelineElement, trackId: string) => {
            if (!canSlipElement(element)) return false;

            e.stopPropagation();
            e.preventDefault();

            setEditingState({
                mode: "slip",
                elementId: element.id,
                trackId,
                startMouseX: e.clientX,
                initialTrimStart: element.trimStart,
                initialTrimEnd: element.trimEnd,
                initialStartTime: element.startTime,
                originalAdjacentElements: {},
            });

            return true;
        },
        [canSlipElement]
    );

    const startSlideEditing = useCallback(
        (e: React.MouseEvent, element: TimelineElement, trackId: string) => {
            e.stopPropagation();
            e.preventDefault();

            const adjacent = getAdjacentElements(trackId, element.id);

            setEditingState({
                mode: "slide",
                elementId: element.id,
                trackId,
                startMouseX: e.clientX,
                initialTrimStart: element.trimStart,
                initialTrimEnd: element.trimEnd,
                initialStartTime: element.startTime,
                originalAdjacentElements: {
                    left: adjacent.left ? {
                        id: adjacent.left.id,
                        startTime: adjacent.left.startTime,
                        duration: adjacent.left.duration - adjacent.left.trimStart - adjacent.left.trimEnd,
                    } : undefined,
                    right: adjacent.right ? {
                        id: adjacent.right.id,
                        startTime: adjacent.right.startTime,
                        duration: adjacent.right.duration - adjacent.right.trimStart - adjacent.right.trimEnd,
                    } : undefined,
                },
            });

            return true;
        },
        [getAdjacentElements]
    );

    const handleSlipSlideMove = useCallback(
        (e: { clientX: number }) => {
            if (editingState.mode === "normal" || !editingState.elementId || !editingState.trackId) return;

            const element = getElementById(editingState.trackId, editingState.elementId);
            if (!element) return;

            const deltaX = e.clientX - editingState.startMouseX;
            const deltaTime = deltaX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);

            if (editingState.mode === "slip") {
                handleSlipMove(element, deltaTime);
            } else if (editingState.mode === "slide") {
                handleSlideMove(element, deltaTime);
            }
        },
        [editingState, getElementById, zoomLevel]
    );

    const handleSlipMove = useCallback(
        (element: TimelineElement, deltaTime: number) => {
            if (element.type !== "media") return;

            const mediaItem = mediaItems.find((item) => item.id === element.mediaId);
            if (!mediaItem || !mediaItem.duration) return;

            // Calculate new trim values
            const newTrimStart = editingState.initialTrimStart + deltaTime;
            const newTrimEnd = editingState.initialTrimEnd - deltaTime;

            // Ensure we don't go beyond the source material bounds
            const maxTrimStart = mediaItem.duration - 0.1; // Leave at least 0.1s
            const maxTrimEnd = mediaItem.duration - 0.1;

            const clampedTrimStart = Math.max(0, Math.min(maxTrimStart, newTrimStart));
            const clampedTrimEnd = Math.max(0, Math.min(maxTrimEnd, newTrimEnd));

            // Ensure the visible duration is at least 0.1s
            const visibleDuration = element.duration - clampedTrimStart - clampedTrimEnd;
            if (visibleDuration < 0.1) return;

            // Additional validation: ensure trim values are within bounds
            const totalTrim = clampedTrimStart + clampedTrimEnd;
            if (totalTrim >= element.duration - 0.1) return;

            onUpdateTrim(editingState.trackId!, element.id, clampedTrimStart, clampedTrimEnd);
        },
        [editingState, mediaItems, onUpdateTrim]
    );

    const handleSlideMove = useCallback(
        (element: TimelineElement, deltaTime: number) => {
            const newStartTime = Math.max(0, editingState.initialStartTime + deltaTime);
            const elementDuration = element.duration - element.trimStart - element.trimEnd;

            // Get current adjacent elements
            const adjacent = getAdjacentElements(editingState.trackId!, element.id);

            // Calculate constraints based on adjacent elements
            let minStartTime = 0;
            let maxStartTime = Infinity;

            if (adjacent.left) {
                const leftEndTime = adjacent.left.startTime + (adjacent.left.duration - adjacent.left.trimStart - adjacent.left.trimEnd);
                minStartTime = leftEndTime;
            }

            if (adjacent.right) {
                maxStartTime = adjacent.right.startTime - elementDuration;
            }

            // Clamp the new start time
            const clampedStartTime = Math.max(minStartTime, Math.min(maxStartTime, newStartTime));

            // Update element position
            onUpdateElementStartTime(editingState.trackId!, element.id, clampedStartTime);

            // Adjust adjacent elements to maintain continuity
            if (adjacent.left && editingState.originalAdjacentElements.left) {
                const leftElement = adjacent.left;
                const newLeftDuration = clampedStartTime - leftElement.startTime;

                if (newLeftDuration > 0.1) { // Minimum duration
                    // Adjust the left element's trim end to fit
                    const originalLeftDuration = editingState.originalAdjacentElements.left.duration;
                    const trimAdjustment = originalLeftDuration - newLeftDuration;
                    const newLeftTrimEnd = leftElement.trimEnd + trimAdjustment;

                    if (newLeftTrimEnd >= 0) {
                        onUpdateTrim(editingState.trackId!, leftElement.id, leftElement.trimStart, newLeftTrimEnd);
                    }
                }
            }

            if (adjacent.right && editingState.originalAdjacentElements.right) {
                const rightElement = adjacent.right;
                const newRightStartTime = clampedStartTime + elementDuration;
                const timeDifference = newRightStartTime - editingState.originalAdjacentElements.right.startTime;

                // Adjust the right element's position and trim
                onUpdateElementStartTime(editingState.trackId!, rightElement.id, newRightStartTime);

                if (timeDifference > 0) {
                    // We're pushing the right element later, so trim its start
                    const newRightTrimStart = rightElement.trimStart + timeDifference;
                    const maxTrimStart = rightElement.duration - rightElement.trimEnd - 0.1;

                    if (newRightTrimStart <= maxTrimStart) {
                        onUpdateTrim(editingState.trackId!, rightElement.id, newRightTrimStart, rightElement.trimEnd);
                    }
                }
            }
        },
        [editingState, getAdjacentElements, onUpdateElementStartTime, onUpdateTrim]
    );

    const endSlipSlideEditing = useCallback(() => {
        setEditingState({
            mode: "normal",
            elementId: null,
            trackId: null,
            startMouseX: 0,
            initialTrimStart: 0,
            initialTrimEnd: 0,
            initialStartTime: 0,
            originalAdjacentElements: {},
        });
    }, []);

    const cancelSlipSlideEditing = useCallback(() => {
        if (editingState.mode === "normal" || !editingState.elementId || !editingState.trackId) return;

        const element = getElementById(editingState.trackId, editingState.elementId);
        if (!element) return;

        // Restore original values
        onUpdateTrim(
            editingState.trackId,
            editingState.elementId,
            editingState.initialTrimStart,
            editingState.initialTrimEnd
        );
        onUpdateElementStartTime(
            editingState.trackId,
            editingState.elementId,
            editingState.initialStartTime
        );

        // Restore adjacent elements if in slide mode
        if (editingState.mode === "slide") {
            const adjacent = getAdjacentElements(editingState.trackId, editingState.elementId);

            if (adjacent.left && editingState.originalAdjacentElements.left) {
                onUpdateElementStartTime(
                    editingState.trackId,
                    adjacent.left.id,
                    editingState.originalAdjacentElements.left.startTime
                );
            }

            if (adjacent.right && editingState.originalAdjacentElements.right) {
                onUpdateElementStartTime(
                    editingState.trackId,
                    adjacent.right.id,
                    editingState.originalAdjacentElements.right.startTime
                );
            }
        }

        endSlipSlideEditing();
    }, [editingState, getElementById, getAdjacentElements, onUpdateTrim, onUpdateElementStartTime, endSlipSlideEditing]);

    return {
        editingMode: editingState.mode,
        isSlipSlideEditing: editingState.mode !== "normal",
        canSlipElement,
        startSlipEditing,
        startSlideEditing,
        endSlipSlideEditing,
        cancelSlipSlideEditing,
        editingElementId: editingState.elementId,
    };
}