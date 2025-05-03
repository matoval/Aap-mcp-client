import React, { useEffect } from 'react';
import "@patternfly/react-core/dist/styles/base.css";
import "@patternfly/virtual-assistant/dist/css/main.css"
import {DropdownList, DropdownItem, TextInput} from '@patternfly/react-core';
import Chatbot, {ChatbotDisplayMode} from '@patternfly/virtual-assistant/dist/dynamic/Chatbot';
import ChatbotContent from '@patternfly/virtual-assistant/dist/dynamic/ChatbotContent';
import ChatbotFooter from '@patternfly/virtual-assistant/dist/dynamic/ChatbotFooter';
import MessageBar from '@patternfly/virtual-assistant/dist/dynamic/MessageBar';
import MessageBox from '@patternfly/virtual-assistant/dist/dynamic/MessageBox';
import Message from '@patternfly/virtual-assistant/dist/dynamic/Message';
import ChatbotHeader, {ChatbotHeaderActions, ChatbotHeaderSelectorDropdown} from '@patternfly/virtual-assistant/dist/dynamic/ChatbotHeader';
import robotIcon from '../robot.png'
import userIcon from '../user.png'
import {GetModels, GetToolList, OllamaChat, McpCallTool} from '../../wailsjs/go/main/App'

export const McpChatbot = () => {
  const [ollamaUrl, setOllamaUrl] = React.useState('');
  const [availableModels, setAvailableModels] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [selectedModel, setSelectedModel] = React.useState('Select a model');
  const [isSendButtonDisabled, setIsSendButtonDisabled] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState();
  const [tools, setTools] = React.useState();
  const scrollToBottomRef = React.useRef(null);
  const displayMode = ChatbotDisplayMode.embedded;

  useEffect(() => {
    if (selectedModel !== 'Select a model') {
      (async () => {
        const toolsList = await GetToolList()
        setTools(toolsList)
      })()
    }
  }, [selectedModel])

  useEffect(() => {
    if (messages.length > 2) {
      scrollToBottomRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages]);
  useEffect(() => {
    if (ollamaUrl !== "") {
      GetModels(ollamaUrl).then((data) => {
        data.models.forEach(model => setAvailableModels(cur =>  [...cur, model.name]))
      })
    }
  }, [ollamaUrl])
  const onSelectModel = (_event, value) => {
    setSelectedModel(value);
  };
  const generateId = () => {
    const id = Date.now() + Math.random();
    return id.toString();
  };
  const handleSend = async message => {
    setIsSendButtonDisabled(true);
    const newMessages = [];
    const date = new Date();
    newMessages.push({
      id: generateId(),
      role: 'user',
      content: message,
      name: 'User',
      avatar: userIcon,
      timestamp: date.toLocaleString(),
    });
    setMessages(msg => [...msg, ...newMessages]);
    const loadingMsg = {
      id: generateId(),
      role: 'bot',
      content: '',
      name: 'Bot',
      avatar: robotIcon,
      isLoading: true,
      timestamp: date.toLocaleString()
    };
    setMessages(msg => [...msg, loadingMsg])
    setAnnouncement(`Message from User: ${message}. Message from Bot is loading.`);
    const body = JSON.stringify({
      "messages": newMessages,
      "model": selectedModel,
      "stream": false,
      "tools": [{
        "type": "function",
        "function": tools
      }]
    })
    const res = await OllamaChat(ollamaUrl, body)
    const data = JSON.parse(res)
    console.log(data)
    if (data.message.tool_calls?.length > 0) {
      for (const toolCall of data.message.tool_calls) {
        const toolFunc = toolCall.function.name;
        const args = toolCall.function.arguments;

        const toolRequest = {
          "params": {
            "name": toolFunc,
            "arguments": args
          }
        }
        console.log(toolRequest)
        const resp = await McpCallTool(toolRequest)
        console.log(resp)
        setMessages(msg => {
          return msg.map(m => m.id === loadingMsg.id ? {...m, isLoading: false, content: resp.content[0].text}: m)
        });
      }
    } else if (data.message.content !== "") {
      setMessages(msg => {
        return msg.map(m => m.id === loadingMsg.id ? {...m, isLoading: false, content: data.message.content}: m)
      });
    }
    setAnnouncement(`Message from Bot: API response goes here`);
    setIsSendButtonDisabled(false);
  };
  return (
    <Chatbot displayMode={displayMode} id="chatbot">
      <ChatbotHeader>
        <TextInput id='ollama_url' type='url' placeholder='Ollama url' onChange={url => setOllamaUrl(url.target.value.replace(/\/$/, ''))} />
        {availableModels.length > 0 &&
          <ChatbotHeaderActions>
            <ChatbotHeaderSelectorDropdown value={selectedModel} onSelect={onSelectModel}>
              <DropdownList>
              {availableModels.map((model) => (
                <DropdownItem value={model} key={model}>
                  {model}
                </DropdownItem>
              )) }
              </DropdownList>
            </ChatbotHeaderSelectorDropdown>
          </ChatbotHeaderActions>
        }
      </ChatbotHeader>
      <ChatbotContent>
        <MessageBox announcement={announcement}>
          {messages.map((message, index) => {
            if (index === messages.length - 1) {
              return <>
                                  <div ref={scrollToBottomRef} key={"ref" + message.id}></div>
                                  <Message key={message.id} {...message} />
                                </>;
            }
            return <Message key={message.id} {...message} />;
          })}
        </MessageBox>
      </ChatbotContent>
      <ChatbotFooter>
        <MessageBar onSendMessage={handleSend} isSendButtonDisabled={isSendButtonDisabled} hasAttachButton={false} />
      </ChatbotFooter>
    </Chatbot>
  );
};