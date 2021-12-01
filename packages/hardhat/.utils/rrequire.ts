import glob from 'glob'
import path from 'path'

const rrequire = (dir: string) => {
  console.log(path.resolve(dir, '**', '*.ts'))
  glob.sync(path.resolve(dir, '**', '*.ts')).forEach((file) => {
    require(path.resolve(file))
  })
}

export default rrequire
