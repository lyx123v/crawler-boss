import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  // 配置
  const city = '101120100'; // 城市代码：济南
  // const city = '101020100'; // 上海
  // const city = '101120200'; // 青岛
  const query = '前端'; // 搜索关键词
  const salary = '405'; // 薪资标准10-20K

  const degreeMap = {
    '202': '专科学历',
    '203': '本科学历'
  }
  const browser = await puppeteer.launch({
    headless: false, // 是否无头模式, 无头模式下不会打开浏览器
    defaultViewport: {
      width: 0, // 0 表示自动调整
      height: 0 // 0 表示自动调整
    }
  });

  const page = await browser.newPage();

  await page.goto(`https://www.zhipin.com/web/geek/job?query=${query}&city=${city}&degree=${Object.keys(degreeMap).join(',')}&salary=${salary}`); // 打开掘金

  await page.waitForSelector('.job-list-box'); // 等待页面显示(.job-list-box)加载完成

  // 获取总页数
  const totalPage = await page.$eval('.options-pages a:nth-last-child(2)', e => {
    return parseInt(e.textContent)
  });

  // 获取所有职位
  const allJobs = [];
  for (let i = 1; i <= totalPage; i++) {
    // 打开指定页
    await page.goto(`https://www.zhipin.com/web/geek/job?query=${query}&city=${city}&degree=${Object.keys(degreeMap).join(',')}&salary=${salary}&page=${i}`);

    await page.waitForSelector('.job-list-box'); // 等待页面显示(.job-list-box)加载完成

    const jobs = await page.$eval('.job-list-box', el => {
      // 获取所有职位
      return [...el.querySelectorAll('.job-card-wrapper')].map(item => {
        const salary = item.querySelector('.salary').textContent;
        const name = item.querySelector('.job-name').textContent;
        const area = item.querySelector('.job-area').textContent;
        const degree = item.querySelector('.job-info .tag-list > li:nth-child(2)').textContent;
        const experience = item.querySelector('.job-info .tag-list > li:nth-child(1)').textContent;
        return {
          job: {
            name, // 职位名称
            area, // 工作地点
            salaryMax: parseInt(salary.split('·')[0].split('-')[1].replace('K', '')), // 薪资最大值
            salaryMin: parseInt(salary.split('·')[0].split('-')[0].replace('K', '')), // 薪资最小值
            salaryType: salary.split('·')[1], // 薪资类型
            salaryMaxYear: (parseInt(salary.split('·')[0].split('-')[1].replace('K', ''))) * (salary.split('·')[1] || 12), // 薪资一年最大值
            salaryMinYear: (parseInt(salary.split('·')[0].split('-')[0].replace('K', ''))) * (salary.split('·')[1] || 12), // 薪资一年最小值
            degree, // 学历
            experience // 经验
          },
          link: item.querySelector('a').href, // 职位链接
          company: {
            name: item.querySelector('.company-name').textContent // 
          }
        }
      })
    });
    allJobs.push(...jobs);
  }

  // console.log(allJobs);

  for (let i = 0; i < allJobs.length; i++) {
    await page.goto(allJobs[i].link); // 打开职位详情页

    try {
      await page.waitForSelector('.job-sec-text'); // 等待页面显示(.job-sec-text)加载完成

      const jd = await page.$eval('.job-sec-text', el => { // 获取职位描述
        return el.textContent
      });
      // job-keyword-list li 是一组dom，请取出里面的内容
      const keywordArray = await page.$$eval('.job-keyword-list li', elements =>
        elements.map(el => el.textContent)
      );
      allJobs[i].desc = jd; // 职位描述
      allJobs[i].keywordArray = keywordArray; // 关键词
    } catch (e) { }
  }
  await browser.close(); // 关闭浏览器
  // JSON格式化
  const file = fs.createWriteStream('./jobs.json'); // 创建文件流
  file.write(JSON.stringify(allJobs, null, 2)); // 写入文件
  file.end(); // 结束文件流
})();