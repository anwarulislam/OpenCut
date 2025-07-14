"use client";

import { Button } from "../ui/button";
import { 
  MousePointer2, 
  Move3D, 
  ArrowLeftRight,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { EditingMode } from "@/hooks/use-slip-slide-editing";

interface SlipSlideToolbarProps {
  currentMode: EditingMode;
  onModeChange: (mode: EditingMode) => void;
  isEditing: boolean;
}

export function SlipSlideToolbar({ 
  currentMode, 
  onModeChange, 
  isEditing 
}: SlipSlideToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-r">
      <TooltipProvider delayDuration={500}>
        <div className="text-xs text-muted-foreground mr-2">Edit Mode:</div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === "normal" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("normal")}
              disabled={isEditing}
              className="h-8 px-2"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Normal Mode</div>
              <div className="text-xs text-muted-foreground">
                Standard timeline editing
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Press 1 to activate
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === "slip" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("slip")}
              disabled={isEditing}
              className="h-8 px-2"
            >
              <Move3D className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Slip Mode</div>
              <div className="text-xs text-muted-foreground">
                Change clip content without moving position
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Press 2 to activate • Alt + drag to slip edit
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === "slide" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("slide")}
              disabled={isEditing}
              className="h-8 px-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Slide Mode</div>
              <div className="text-xs text-muted-foreground">
                Move clip and adjust adjacent clips
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Press 3 to activate • Shift + drag to slide edit
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {isEditing && (
          <div className="flex items-center gap-1 ml-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Press ESC to cancel</span>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}