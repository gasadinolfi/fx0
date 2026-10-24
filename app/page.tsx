import ChatPage from '../components/chat-page'

export default function Page({ searchParams }: PageProps<'/'>) {
  return <ChatPage searchParams={searchParams} />
}
