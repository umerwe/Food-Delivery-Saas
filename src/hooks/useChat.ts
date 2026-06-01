"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  createChatThread,
  deleteChat,
  fetchChatThreadMessages,
  fetchChatThreads,
  getChat,
  patchChat,
  postChat,
  sendChatMessage,
  type CreateChatThreadPayload,
} from "@/services/chat";

const service = {
  get: getChat,
  post: postChat,
  patch: patchChat,
  del: deleteChat,
};

export const useChat = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.chat.request });

  const addChatThread = useCallback(
    ({ payload }: { payload: CreateChatThreadPayload }) => createChatThread({ payload, token }),
    [token]
  );

  const getChatThreads = useCallback(() => fetchChatThreads(token), [token]);

  const getChatThreadMessages = useCallback(
    ({ threadId }: { threadId: string }) => fetchChatThreadMessages({ threadId, token }),
    [token]
  );

  const addChatMessage = useCallback(
    ({ threadId, message }: { threadId: string; message: string }) =>
      sendChatMessage({ threadId, payload: { message }, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      createChatThread: addChatThread,
      fetchChatThreads: getChatThreads,
      fetchChatThreadMessages: getChatThreadMessages,
      sendChatMessage: addChatMessage,
    }),
    [api, addChatMessage, addChatThread, getChatThreadMessages, getChatThreads]
  );
};

export default useChat;
