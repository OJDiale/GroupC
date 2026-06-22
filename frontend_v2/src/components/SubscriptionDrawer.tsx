import { Crown, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Dispatch, SetStateAction } from "react"
 type Role = "ADMIN"|"PREMIUM"|"USER"
interface SubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setValue:Dispatch<SetStateAction<Role>>;
}

export function SubscriptionDrawer({ isOpen, onClose ,setValue}: SubscriptionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-[#030303]/98 border-t border-white/10 text-slate-200 backdrop-blur-xl z-[9999]">
        
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Compressed master wrapper padding */}
        <div className="mx-auto w-full max-w-sm px-5 pt-3 pb-6">
          
          {/* Header Area */}
          <DrawerHeader className="text-center flex flex-col items-center p-0 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white mb-2.5">
              <Crown size={18} className="stroke-[1.5]" />
            </div>
            
            <DrawerTitle className="text-xl font-light tracking-tight text-white">
              Elevate Your System
            </DrawerTitle>
            
            <DrawerDescription className="text-xs text-slate-500 font-normal max-w-xs mt-1 leading-normal">
              Unlock unrestricted access to the AI Safe Path engine and community crowd telemetry.
            </DrawerDescription>
          </DrawerHeader>

          {/* Core Feature Rows */}
          <div className="space-y-2.5 mb-5 px-0.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0 stroke-[2.5]" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-200">AI Route Compute</h4>
                <p className="text-[11px] text-slate-500">Surgical path-node risk assessment mapping.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0 stroke-[2.5]" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-200">Live Incident Streams</h4>
                <p className="text-[11px] text-slate-500">Real-time hazard telemetry broadcast tracking.</p>
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300">Premium Tier Pass</p>
              <p className="text-[10px] text-slate-500">Complete architectural access</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-light text-white tracking-tight">
                R49<span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <DrawerFooter className="flex flex-col gap-2 p-0">
            <Button 
              onClick={() => {
                setValue("PREMIUM")
                toast.success("Welcome aboard, Premium Explorer!");
                onClose();
              }}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-blue-600/10 group flex items-center justify-center gap-1.5 border-none"
            >
              Activate Access
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
            
            <DrawerClose asChild>
              <button 
                onClick={onClose}
                className="w-full text-center text-slate-500 hover:text-slate-400 text-xs font-medium pt-1 pb-0 transition-colors bg-transparent border-none outline-none cursor-pointer"
              >
                Return to basic view
              </button>
            </DrawerClose>
          </DrawerFooter>
          
        </div>
      </DrawerContent>
    </Drawer>
  )
}
