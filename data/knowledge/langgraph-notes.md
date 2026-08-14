# LangGraph 学习笔记

LangGraph 是低层 Agent 编排框架。核心概念是 State、Node 和 Edge。State 保存工作流数据，Node 执行步骤，Edge 决定执行顺序。

StateGraph 编译后可以 invoke、stream，并可配置 Checkpointer。条件边用于分支路由，Command 可以同时更新状态和控制跳转。

`interrupt()` 会暂停执行并保存状态，适合人工审批、补充输入和高风险操作。恢复时使用相同 thread_id，并通过 `Command({ resume: ... })` 提供人工决策。
