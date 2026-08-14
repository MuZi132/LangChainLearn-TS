# LangChain 学习笔记

LangChain 是构建大模型应用和 Agent 的高层框架。核心组件包括模型、消息、结构化输出、工具、Agent、Middleware 和 Runtime。

`createAgent()` 会组合模型、工具、系统提示词和中间件，并在模型与工具之间自动循环，直到模型返回最终回答。

短期记忆由 Checkpointer 保存，范围通常是一个 thread。调用时复用同一个 `thread_id`，Agent 才能恢复该会话的消息状态。

长期记忆由 Store 保存，数据按 namespace 和 key 组织，可以跨 thread 读取。用户偏好和稳定事实适合放在长期记忆中。
