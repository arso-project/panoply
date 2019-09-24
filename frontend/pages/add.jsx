import React, { useState, useEffect, useMemo } from 'react'
import Wrapper from '../components/wrapper.jsx'
import { generate } from '../../lib/id'
import styles from './add.css'
import { EventEmitter } from 'events'
import { RecordCard, Card, Meta } from '../components/list.jsx'
import { useUpdate } from '../lib/utils'
import cn from 'classnames'

// GLOBALS (have to move)

const entitySchema = {
  properties: {
    label: { type: 'string', description: 'Label' },
    description: { type: 'string', description: 'Description' },
    resources: {
      type: 'array',
      description: 'Resource',
      items: {
        type: 'string'
      }
    }
  }
}

let store
function getStore () {
  if (!store) store = new ResourceStore()
  return store
}

export default function AddPage (props) {
  const [show, setShow] = useState(true)
  return (
    <Wrapper>
      <h1>Add files</h1>
      <h3 onClick={e => setShow(s => !s)}>{show ? 'hide' : 'show'}</h3>
      {show && <UploadFile />}
    </Wrapper>
  )
}

function UploadFile (props) {
  const [fileList, setFileList] = useState([])
  const [selectedFile, selectFile] = useState(null)

  console.log('render', fileList)
  return (
    <div className={styles.Page}>
      <nav>
        <form>
          <input type='file' onChange={onFileInputChange} multiple />
        </form>
        <ul className={styles.FileList}>
          {fileList.map((file, i) => (
            <li key={i} className={cn({ [styles.active]: file === selectedFile })}>
              <a onClick={e => selectFile(file)}>{file.name}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        {selectedFile && <ResourceFromFile file={selectedFile} />}
      </div>
    </div>
  )

  function onFileInputChange (e) {
    const fileList = e.target.files
    console.log('onchange', fileList)
    const files = []
    for (const file of fileList) {
      // TODO: Preserve ids between changes.
      files.push({
        id: generate(),
        name: file.webkitRelativePath || file.name,
        size: file.size,
        pending: false,
        done: false,
        written: 0,
        speed: 0
      })
    }
    console.log('files', files)
    setFileList(files)
  }
}

function ResourceFromFile (props) {
  const { file } = props
  const store = getStore()
  const resource = store.fromFile(file)
  return (
    <Resource resource={resource} />
  )
}

function Resource (props) {
  const [label, setLabel] = useState('')
  const { resource } = props

  return (
    <div className={styles.Resource}>
      <h3>Resource</h3>
      <ul>
        <li>
          <em>ID:</em>
          <strong>{resource.id}</strong>
        </li>
        <li>
          <em>Files:</em>
          <ul>
            {resource.files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </li>
        <li>
          <em>Label</em>
          <span>
            {label}
            <input type='text' onChange={e => setLabel(e.target.value)} />
          </span>
        </li>
        <li>
          <em>Extract Metadata</em>
          <button onClick={e => {}}>Auto-detect extractor and run</button>
        </li>
      </ul>
      <Records resource={resource} />
    </div>
  )
}

function Records (props) {
  const { resource } = props
  const triggerUpdate = useUpdate()
  const store = getStore()
  useEffect(() => {
    store.on('update', () => {
      console.log('update!', store)
      triggerUpdate()
    })
    return () => store.removeListener('update', triggerUpdate)
  }, [])
  const records = store.getRecordsForResource(resource)
  console.log('RECORDS', records)

  const createEntity = (
    <div>
      <a onClick={e => store.createEntityForResource(resource)}>
        Create new entity
      </a> or <a>add to existing entity</a>
    </div>
  )

  if (!records.length) return createEntity

  return (
    <div>
      {createEntity}
      <RecordList records={records} onChange={onRecordChange} />
    </div>
  )

  function onRecordChange (record) {
    console.log('onRecordChange', record)
    store.put(record)
  }
}

function RecordList (props) {
  const { records, onChange } = props
  console.log(records)
  return (
    <div>
      {records.map((record, i) => {
        const Component = componentForRecord(record)
        return <Component record={record} onChange={onChange} key={i} />
      })}
    </div>
  )
}

function componentForRecord (record) {
  const components = {
    'arso.xyz/Entity': Entity
  }
  if (components[record.schema]) return components[record.schema]
  else return components.default
}

function Entity (props) {
  const { record, onChange } = props
  console.log('Entity', record)
  const { source, schema, id, value } = record
  const fields = jsonSchemaToFields(entitySchema, {
    include: ['label', 'description']
  })
  const body = (
    <Form fields={fields} value={value} onChange={onFormChange} />
  )

  function onFormChange (newValue) {
    const newRecord = { ...record, value: newValue }
    console.log('setValue', newRecord)
    onChange(newRecord)
  }

  return (
    <Card
      meta={<Meta record={record} />}
      header={id}
      body={body}
    />
  )
}

function jsonSchemaToFields (schema, opts) {
  if (Array.isArray(opts.include)) opts.include = arrayFilter(opts.include)
  const fields = []
  for (const [key, value] of Object.entries(schema.properties)) {
    if (opts.include && !opts.include(key)) continue
    fields.push({
      name: key,
      label: value['ui:label'] || value.description || key,
      ...value
    })
  }

  return fields

  function arrayFilter (include) {
    return (key) => include.indexOf(key) > -1
  }
}

function Form (props) {
  const { fields, value, onChange } = props
  console.log('Form', fields, value)
  return (
    <form>
      {fields.map(field => makeField(field))}
    </form>
  )

  function makeField (field) {
    let { name, label, type, Component } = field
    if (!Component) Component = getFieldWidget(type)
    return (
      <div key={name}>
        <label htmlFor={name}>
          {label}
        </label>
        <Component value={value[name] || null} onChange={value => onValueChange(name, value)} />
      </div>
    )
  }

  function onValueChange (name, fieldValue) {
    onChange({ ...value, [name]: fieldValue })
  }
}

function getFieldWidget (type) {
  if (type === 'string') {
    return StringWidget
  } else return UnsuportedWidget
}

function StringWidget (props) {
  const value = props.value || ''
  return <input type='text' onChange={e => props.onChange(e.target.value)} value={value} />
}

function UnsuportedWidget (props) {
  return (
    <span>
      <em>Not supported</em>
    </span>
  )
}

class ResourceStore extends EventEmitter {
  constructor () {
    super()
    this.byFilename = {}
    this.byId = {}
    this.resources = []
    this.records = {}
    this.recordsByResource = {}
  }

  getRecordsForResource (resource) {
    if (this.recordsByResource[resource.id]) {
      return [...this.recordsByResource[resource.id]].map(id => this.records[id])
    } else return []
  }

  createEntityForResource (resource) {
    const record = {
      id: generate(),
      schema: 'arso.xyz/Entity',
      value: {
        resources: [resource.id],
        label: '',
        description: '',
        primarySchema: null
      }
    }

    this.put(record)
  }

  put (record) {
    console.log('put', record)
    this.records[record.id] = record
    const { value } = record
    if (value.resources) {
      for (const id of value.resources) {
        if (!this.recordsByResource[id]) {
          this.recordsByResource[id] = new Set()
        }
        this.recordsByResource[id].add(record.id)
      }
    }
    this.emit('update')
  }

  fromFile (file) {
    if (!this.byFilename[file.name]) {
      const resource = this._createFromFile(file)
      this.byFilename[file.name] = resource
      this.byId[resource.id] = resource
      this.resources.push(resource)
    }
    return this.byFilename[file.name]
  }

  _createFromFile (file) {
    return {
      files: [file],
      id: generate(),
      mimetype: 'video/mp4' // todo: derive from filename
    }
  }
}
