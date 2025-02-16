import fs from 'fs';
(async () => {
  let data = JSON.parse(fs.readFileSync('./jobs.json', 'utf-8'));
  data = data
    .filter(item => item.job.name.includes('前端')) // 关键词
  // .filter(item => item.job.degree === '本科') // 学历
  // 排序
  data.sort((a, b) => b.job.salaryMaxYear - a.job.salaryMaxYear);
  console.log(data);
  console.log(data.length);
  // fs.writeFileSync('./jobs.json', JSON.stringify(jobs, null, 2));
})();