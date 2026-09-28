'use client'

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, CopyCheck, Loader, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuth } from "@/context/auth-context";


type Message = {
  role: 'user' | 'ai',
  content: string
}


function Chat({ chatId }: { chatId: string }) {


  const [message,setMessage] = useState('')
  const [loading,setLoading] = useState(false)
  const disableSend = message === ''
  const [messages,setMessages] = useState<Message[]>([])
  const [copy,setCopy] = useState({
    index: 0,
    type: '',
  })
  const [dots, setDots] = useState('')
  const { user } = useAuth();

  console.log('user', user)
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () =>{
    try{
      setLoading(true)
      setMessage('')
      
      setMessages((prev) => [...prev, { role: 'user', content: message }]);

      // if(res.status === 200){
      //   setMessages((prev) => [...prev, { role: 'ai', content: res.data.response }]);
      // }
      
    }catch{

    }finally{
      setLoading(false)
    }
  }

  const handleEnterPressed = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disableSend && !loading) {
        handleSend();
      }
    }
  };

  const handleAction = async (index: number, type: 'text' | 'code' | 'like' | 'dislike', text?: string) => {    
    try {      
      if( type === 'code' || type === 'text' ){
        await navigator.clipboard.writeText(text!);
        toast.success("Copied to cliboard")
        setCopy({type, index})
        setTimeout(() => {
          setCopy({index:0,  type: ''})
        }, 2000);
      }else{
        toast.success('Thank you for your feedback')
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if( status === 'loading') return null

  if (!user) return null;


    return (
         <div className='flex md:mx-20 border-l dark:border-l-white/20 border-l-black/20 border-r border-r-black/20 dark:border-r-white/20'>
                  {
                    messages.length === 0 && <div className="flex justify-center mt-20 mb-10">
                      <h1 className="text-3xl font-mono font-semibold text-center">Hi <span className=''>{user.display_name}</span>, what would you like to talk about?</h1>
                    </div>
                  }
                  {messages && messages.length ? (
                    <div className='h-[73vh] mt-2 overflow-y-scroll scrollbar-hide w-[100%] md:w-[80%] mx-auto'>
                      {messages.map((mssg: Message, index: number) => (
                        <div key={index} className="flex flex-col mb-6">
                          <div className={`flex ${mssg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex gap-2 items-start max-w-[100%] md:max-w-[80%]">
                              {mssg.role === 'ai' && (
                                <Image
                                  src={'/icons/app-logo.png'}
                                  width={30}
                                  height={30}
                                  alt={'user logo'}
                                  className="rounded-full md:block hidden"
                                />
                              )}
                              <div className="flex flex-col">
                                <span className={`font-semibold font-mono bg-muted rounded-md px-3 py-2 break-words ${mssg.role === 'ai' ? 'rounded-tl-none ': 'rounded-tr-none'}`}>
                                  {mssg.content.includes('```') ? (
                                    mssg.content.split(/```/).map((block, i) => (
                                      i % 2 === 0 ? (
                                        <span key={i}>
                                          {block.split(/(\*\*.*?\*\*|[-•*]\s)/).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                              return <span key={j} className="text-blue-400">{part.slice(2, -2)}</span>;
                                            } else if (['- ', '• ', '* '].some(bullet => part.startsWith(bullet))) {
                                              return <><br key={j}/><br/>{part}</>;
                                            }
                                            return part;
                                          })}
                                        </span>
                                      ) : (
                                        <div key={i} className="dark:bg-black dark:text-white bg-white text-black font-mono text-sm p-3 rounded-md my-2 whitespace-pre-wrap">
                                          <div className='flex justify-end'>
                                            {
                                              copy.type === 'code' && copy.index === index ? 
                                              <div className='flex items-center gap-2 cursor-pointer text-green-600'>
                                                <CopyCheck className='w-4 h-4'/>
                                                <span>Copied</span>
                                              </div>
                                              : <button className='flex items-center gap-2 cursor-pointer' onClick={() => handleAction(index,'code',block)}>
                                                <Copy className='w-4 h-4'/>
                                                <span>Copy</span>
                                              </button>
                                            }
                                          </div>
                                          {block}
                                        </div>
                                      )
                                    ))
                                  ) : (
                                    <span>
                                    {mssg.content.split(/(\*\*.*?\*\*|[-•*]\s)/).map((part, i) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        return <span key={i} className="text-blue-400">{part.slice(2, -2)}</span>;
                                      } else if (['- ', '• ', '* '].some(bullet => part.startsWith(bullet))) {
                                        return <><br key={i}/><br/>{part}</>;
                                      } else if (
                                        part.toLowerCase().includes('soufian boukir') ||
                                        part.toLowerCase().includes('soufianboukir.com')
                                      ) {
                                        const parts = part.split(/(soufian boukir|soufianboukir\.com)/i);
                                      
                                        return parts.map((p, j) =>
                                          p.toLowerCase() === 'soufian boukir' || p.toLowerCase() === 'soufianboukir.com'
                                            ? <a key={`${i}-${j}`} href='https://soufianboukir.com' target='_blank' className="text-yellow-600 hover:text-yellow-700 duration-100">{p}</a>
                                            : p
                                        );
                                      }
                                      return part;
                                    })}
                                  </span>
                                  )}
                                </span>
                                {mssg.role === 'ai' && (
                                  <div className="flex justify-end gap-3 mt-2">
                                    {
                                      copy.type === 'text' && index === copy.index ?
                                        <CopyCheck className="w-4 h-4 stroke-3 cursor-pointer hover:opacity-70 text-green-600" />
                                      :
                                      <Copy className="w-4 h-4 stroke-3 cursor-pointer hover:opacity-70" onClick={() => handleAction(index,'text',mssg.content)}/>
                                    }
                                    <ThumbsUp className="w-4 h-4 stroke-3 cursor-pointer hover:opacity-70" onClick={() => handleAction(index,'like')}/>
                                    <ThumbsDown className="w-4 h-4 stroke-3 cursor-pointer hover:opacity-70" onClick={() => handleAction(index,'dislike')}/>
                                  </div>
                                )}
                              </div>
                              {mssg.role === 'user' && user.avatar_url && (
                                <Image
                                  src={user.avatar_url}
                                  width={30}
                                  height={30}
                                  alt={'user logo'}
                                  className="rounded-full md:block hidden"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {
                        loading && <div className='mb-3'>
                            <div className='flex justify-start gap-2 items-center font-semibold font-mono'>
                              <Image
                                src={'/icons/app-logo.png'}
                                width={30}
                                height={30}
                                alt={'user logo'}
                                className="rounded-full"
                              />
                              <span>Thinking{dots}</span>
                            </div>
                          </div>
                      }
                    <div ref={messagesEndRef}/>
                    </div>
                  ) : null}

                  <div className="fixed bottom-4 left-4 px-4 py-2 bg-white dark:bg-zinc-900 border border-blue-500 shadow-lg animate-fade-in font-semibold rounded-full">
                    <a className="text-sm text-gray-700 dark:text-gray-300" href='https://soufianboukir.com' target='_blank'>
                      Built with ❤️ by <span className="text-blue-600 font-semibold">Soufian</span>
                    </a>
                  </div>


                  <div className="w-[90%] md:w-[60%] mx-auto relative">
                    <Textarea placeholder="Type somthing..." onKeyDown={handleEnterPressed} className="text-sm"  rows={4} value={message} onChange={(e) => setMessage(e.target.value)}/>
                    <Button className="absolute end-3 bottom-3 rounded-full" disabled={disableSend || loading} onClick={handleSend}>
                        {
                          loading ? <Loader className='animate-spin'/>
                          : 
                          <Send />
                        }
                      </Button>
                  </div>
          </div>   
    )
}


export default Chat