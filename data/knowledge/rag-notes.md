# RAG 学习笔记

RAG 是 Retrieval-Augmented Generation，即检索增强生成。基本流程是：加载文档、切分 Chunk、生成 Embedding、写入向量库、检索相关 Chunk、把检索结果和问题一起交给模型。

Chunk 太大会混入无关内容，太小会丢失上下文。常见起点是 500 到 1000 字符，并保留 10% 到 20% 的重叠，再通过真实问题评估。

Retriever 是可调用的检索接口，VectorStore 可以通过 `asRetriever()` 转换为 Retriever。回答应保留 source、page、chunk_id 等 metadata 以便引用和调试。
