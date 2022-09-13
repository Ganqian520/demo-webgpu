画多个烟花buffer该如何定义

报错解决记录：
  invalid bindGroup:
    

哪些是开始时算一次 每帧算一次 每个顶点算一次

顶点着色器
片元着色器
ndc坐标系
渲染管线
渲染通道
顶点插槽
资源绑定
mvp矩阵
光栅化



绘制多个物体的四种方式：多buffer 多group 动态group 多组绘制
性能消耗：setPipeline > setVertexBuffer > setBindGroup