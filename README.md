Site Validator
========

We use [`pnpm`]() instead of NPM to manage dependencies.

[`pnpm`]: https://pnpm.js.org/

Usage
--------

1. Install dependencies via `pnpm i`
2. Create a configuration file, like `or.js'
3. `startUrl` is the entry URL where to begin checking
4. `domains` defines the hostname which also should be checked
5. Validate your site via `node index.js --config=your-config.js`


网站校验器
========

使用说明
--------

1. 使用 `pnpm i` 安装依赖
2. 参考 `or.js` 的格式，创建你的配置文件
3. `startUrl` 表示开始检查的入口
4. `domains` 表示哪些域名需要被检查
5. 接下来，执行 `node index.js --config=你的配置文件.js` 开始检查即可
