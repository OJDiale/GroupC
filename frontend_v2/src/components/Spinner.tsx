export default function Spinner(){
    //spinner here for loading states 
    return<div className="flex size-full justify-center items-center  space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
            </div>
}